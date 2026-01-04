"use client";
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { X, Send, Minus, Loader2, Trash2, CheckCheck, Edit2, Check, XCircle, Reply, Copy } from "lucide-react";
import { useNotification } from "@/context/NotificationContext";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  text: string;
  createdAt: string;
  isRead?: boolean;
  replyTo?: string | null;  // For reply feature
  replyToText?: string | null; // Preview text
}

interface ChatWindowProps {
  myId: string;
  myName: string;
  myPhoto: string | null;
  otherUser: { id: string; name: string; photoURL: string };
  onClose: () => void;
  customClass?: string;
}

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Notiflix from "notiflix";

export default function ChatWindow({ myId, myName, myPhoto, otherUser, onClose, customClass }: ChatWindowProps) {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(true);

  // Status
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [otherUserRole, setOtherUserRole] = useState<string | null>(null);

  // Selection & Actions
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());

  // Edit & Reply
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const { notify } = useNotification();

  const typingTimeoutRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<any>(null);

  const roomId = [myId, otherUser.id].sort().join("_");

  // Helper: Format Relative Time
  const formatLastSeen = (isoString: string) => {
    if (!isoString) return "Offline";
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Last seen just now";
    if (diffInSeconds < 3600) return `Last seen ${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `Last seen ${Math.floor(diffInSeconds / 3600)}h ago`;
    return `Last seen ${date.toLocaleDateString()}`;
  };

  useEffect(() => {
    // FETCH ROLE & INITIAL STATUS
    const fetchUserStatus = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", otherUser.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setOtherUserRole(data.role);
          // Set initial status agar tidak menunggu socket event
          if (data.isOnline !== undefined) setIsOnline(data.isOnline);
          if (data.lastSeen) setLastSeen(data.lastSeen);
        }
      } catch (e) { console.error("Error fetching user status", e); }
    };
    fetchUserStatus();
  }, [otherUser.id]);

  useEffect(() => {
    // FETCH HISTORY FUNCTION
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/chat/history/${roomId}?userId=${myId}`);
        if (response.ok) {
          const data: Message[] = await response.json();
          // Safety Check: Jangan kosongkan message jika fetch gagal/kosong tapi kita punya data sebelumnya? 
          // (Tergantung usecase, tapi biasanya fetch history adalah source of truth).
          // Namun jika network error (catch block), jangan setMessages([]).
          setMessages(data);

          // Mark as Read Logic
          const unreadIds = data
            .filter((m) => m.senderId !== myId && !m.isRead)
            .map((m) => m.id);

          if (unreadIds.length > 0 && socketRef.current) {
            socketRef.current.emit("readMessage", {
              roomId,
              userId: myId,
              messageIds: unreadIds
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
        // Jangan setMessages([]) di sini agar chat lama (jika ada di state) tidak hilang saat offline
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    };

    const socket = io(process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:3001", {
      transports: ["websocket"],
      query: { userId: myId }
    });
    socketRef.current = socket;

    socket.emit("joinRoom", { roomId });
    fetchHistory(); // Initial fetch

    socket.on("receiveMessage", (newMsg: Message) => {
      setIsTyping(false);
      setMessages((prev) => {
        // Prevent duplicate append
        if (prev.some((msg) => msg.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      scrollToBottom();

      if (newMsg.senderId !== myId) {
        socket.emit("readMessage", {
          roomId,
          userId: myId,
          messageIds: [newMsg.id],
        });
      }
    });

    socket.on("displayTyping", (data: { userId: string; isTyping: boolean }) => {
      if (data.userId !== myId) {
        setIsTyping(data.isTyping);
        if (data.isTyping) scrollToBottom();
      }
    });

    socket.on('userStatus', (data: { userId: string; isOnline: boolean; lastSeen?: string }) => {
      if (data.userId === otherUser.id) {
        setIsOnline(data.isOnline);
        if (data.lastSeen) setLastSeen(data.lastSeen);
      }
    });

    socket.on("messagesReadUpdate", (data: { messageIds: string[] }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          data.messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
        )
      );
    });

    socket.on("messageEdited", (data: { messageId: string; newText: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, text: data.newText } : msg
        )
      );
    });

    socket.on("messageDeleted", (data: { messageIds: string[] }) => {
      setMessages((prev) => prev.filter((msg) => !data.messageIds.includes(msg.id)));
    });

    // RE-FETCH saat user kembali ke Tab (Mobile wake-up)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Chat Window visible: fetching latest messages...");
        fetchHistory(); // Safe fetch

        // Ensure socket is connected
        if (!socket.connected) {
          socket.connect();
          socket.emit("joinRoom", { roomId });
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      socket.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [roomId, myId, otherUser.id]);

  const scrollToBottom = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!socketRef.current) return;
    socketRef.current.emit("typing", { roomId, userId: myId, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("typing", { roomId, userId: myId, isTyping: false });
    }, 2000);
  };

  // State
  const [isSending, setIsSending] = useState(false);

  // ...

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current || isSending) return; // Prevent double send

    setIsSending(true);
    socketRef.current.emit("typing", { roomId, userId: myId, isTyping: false });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const tempId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const msgData: Message = {
      id: tempId,
      roomId,
      senderId: myId,
      senderName: myName,
      senderPhoto: myPhoto || "",
      text: input,
      createdAt: new Date().toISOString(),
      isRead: false,
      replyTo: replyingTo?.id || null,
      replyToText: replyingTo?.text || null
    } as any;

    setMessages((prev) => [...prev, msgData]);
    // Emit and wait slightly to throttle
    socketRef.current.emit("sendMessage", msgData);

    setInput("");
    setReplyingTo(null);

    setTimeout(() => setIsSending(false), 500); // Debounce 500ms
  };

  // Selection Logic
  const toggleSelection = (messageId: string) => {
    setSelectedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) newSet.delete(messageId);
      else newSet.add(messageId);
      if (newSet.size === 0) setSelectionMode(false);
      return newSet;
    });
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedMessages(new Set());
  };

  const deleteSelectedMessages = async () => {
    if (selectedMessages.size === 0) return;
    const messageList = Array.from(selectedMessages);

    Notiflix.Confirm.show(
      'Delete Messages',
      `Delete ${messageList.length} selected message(s)?`,
      'Delete',
      'Cancel',
      async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/chat/messages`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messageIds: messageList, userId: myId })
          });

          if (res.ok) {
            socketRef.current?.emit("deleteMessages", { roomId, messageIds: messageList });
            setMessages((prev) => prev.filter((msg) => !messageList.includes(msg.id)));
            exitSelectionMode();
            notify('Success', 'Messages deleted', 'success');
          }
        } catch (err) {
          console.error(err);
          notify('Error', 'Failed to delete messages', 'error');
        }
      }
    );
  };

  // Edit Logic
  const startEditMessage = (msg: Message) => {
    if (msg.senderId !== myId) return;
    setEditingMessageId(msg.id);
    setEditText(msg.text);
    exitSelectionMode(); // Exit selection when editing
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const saveEdit = async () => {
    if (!editText.trim() || !editingMessageId) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/chat/messages/${editingMessageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editText, userId: myId })
      });

      if (res.ok) {
        socketRef.current?.emit("editMessage", { roomId, messageId: editingMessageId, newText: editText });
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === editingMessageId ? { ...msg, text: editText } : msg
          )
        );
        cancelEdit();
        notify('Success', 'Message updated', 'success');
      }
    } catch (err) {
      console.error(err);
      notify('Error', 'Failed to update message', 'error');
    }
  };

  const handleReply = (msg: Message) => {
    setReplyingTo(msg);
    exitSelectionMode();
    document.querySelector<HTMLInputElement>('input[placeholder="Type your message..."]')?.focus();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    notify('Success', 'Copied to clipboard', 'success');
    exitSelectionMode();
  };

  // Long press handler (500ms)
  const handleTouchStart = (msg: Message) => {
    longPressTimerRef.current = setTimeout(() => {
      setSelectionMode(true);
      toggleSelection(msg.id);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const handleDeleteChat = async (e: React.MouseEvent) => {
    e.stopPropagation();
    Notiflix.Confirm.show(
      'Delete Chat',
      'Hapus chat ini? (Hanya hilang di sisi Anda)',
      'Hapus',
      'Batal',
      async () => {
        try {
          setLoading(true);
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/chat/history/${roomId}?userId=${myId}`, {
            method: "DELETE",
          });
          if (res.ok) setMessages([]);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
      }
    );
  };

  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 w-64 bg-fdvp-card/90 backdrop-blur-xl border border-fdvp-text/10 cursor-pointer p-3 rounded-2xl flex items-center justify-between shadow-2xl hover:scale-105 transition-all z-[6000]"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-fdvp-text/5 flex items-center justify-center border border-fdvp-text/10 overflow-hidden">
              {otherUser.photoURL ? <img src={otherUser.photoURL} alt={otherUser.name} className="w-full h-full object-cover" /> : <span className="font-bold text-fdvp-text-light">{otherUser.name.charAt(0)}</span>}
            </div>
            <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-fdvp-card rounded-full ${isOnline ? "bg-green-500" : "bg-gray-500"}`}></div>
          </div>
          <span className="font-bold text-fdvp-text-light text-sm truncate max-w-[100px]">{otherUser.name}</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-fdvp-text/70 hover:text-fdvp-text-light p-1 hover:bg-fdvp-text/10 rounded-full transition-colors"><X size={16} /></button>
      </div>
    );
  }

  const containerClass = customClass
    ? `bg-fdvp-card/90 backdrop-blur-xl border border-fdvp-text/10 rounded-3xl shadow-2xl flex flex-col z-[6000] font-sans overflow-hidden ${customClass}`
    : "fixed bottom-5 right-5 w-80 md:w-96 h-[600px] bg-fdvp-card/90 backdrop-blur-xl border border-fdvp-text/10 rounded-3xl shadow-2xl flex flex-col z-[6000] font-sans overflow-hidden animate-in slide-in-from-bottom-5";

  // Helpers for Selection Header
  const selectedMsgList = messages.filter(m => selectedMessages.has(m.id));
  const isOneSelected = selectedMsgList.length === 1;
  const canEditSelected = isOneSelected && selectedMsgList[0].senderId === myId;

  return (
    <div className={containerClass}>

      {/* HEADER */}
      <div className="bg-fdvp-text/5 p-4 flex justify-between items-center cursor-pointer border-b border-fdvp-text/5 relative overflow-hidden" onClick={() => !customClass && !selectionMode && setIsMinimized(true)}>

        {selectionMode ? (
          <div className="flex items-center gap-2 relative z-10 w-full animate-in fade-in slide-in-from-top-2">
            <button onClick={exitSelectionMode} className="p-1.5 hover:bg-fdvp-text/10 rounded-full transition-colors">
              <XCircle size={20} className="text-fdvp-text-light" />
            </button>
            <span className="font-bold text-fdvp-text-light text-sm mr-auto">{selectedMessages.size} Selected</span>

            {/* Action Buttons for Selection */}
            {isOneSelected && (
              <>
                <button onClick={(e) => { e.stopPropagation(); handleReply(selectedMsgList[0]); }} className="p-2 hover:bg-fdvp-primary/20 hover:text-fdvp-primary rounded-full transition-all" title="Reply">
                  <Reply size={18} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleCopy(selectedMsgList[0].text); }} className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded-full transition-all" title="Copy">
                  <Copy size={18} />
                </button>
                {canEditSelected && (
                  <button onClick={(e) => { e.stopPropagation(); startEditMessage(selectedMsgList[0]); }} className="p-2 hover:bg-green-500/20 hover:text-green-400 rounded-full transition-all" title="Edit">
                    <Edit2 size={18} />
                  </button>
                )}
              </>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); deleteSelectedMessages(); }}
              className="p-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-full transition-all ml-1"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 relative z-10 w-full overflow-hidden">
              <div className="relative group shrink-0">
                <div className="w-10 h-10 rounded-full bg-fdvp-text/5 flex items-center justify-center border border-fdvp-text/10 overflow-hidden group-hover:border-fdvp-primary/50 transition-all">
                  {otherUser.photoURL ? <img src={otherUser.photoURL} alt="" className="w-full h-full object-cover" /> : <span className="text-fdvp-text-light font-bold text-lg">{otherUser.name.charAt(0)}</span>}
                </div>
                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-fdvp-card rounded-full ${isTyping ? "bg-fdvp-primary animate-bounce" : isOnline ? "bg-green-500" : "bg-gray-500"}`}></div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-fdvp-text-light text-sm tracking-wide truncate">{otherUser.name}</h4>
                  {otherUserRole && ['owner', 'administrator', 'superadmin', 'admin', 'staff'].includes(otherUserRole) && (
                    <span className="text-[9px] bg-fdvp-primary/20 text-fdvp-primary px-1.5 py-0.5 rounded font-mono uppercase shrink-0">
                      {otherUserRole}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-fdvp-text/50 font-medium tracking-wider uppercase">
                  {isTyping ? "TYPING..." : isOnline ? "ONLINE" : formatLastSeen(lastSeen || "")}
                </p>
              </div>
            </div>
            <div className="flex gap-1 text-fdvp-text/70 items-center shrink-0 ml-2">
              <button onClick={handleDeleteChat} className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-all" title="Delete for me"><Trash2 size={16} /></button>
              {!customClass && <button onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }} className="p-1.5 hover:bg-fdvp-text/10 hover:text-fdvp-text-light rounded-full transition-all"><Minus size={18} /></button>}
              <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1.5 hover:bg-fdvp-text/10 hover:text-fdvp-text-light rounded-full transition-all"><X size={18} /></button>
            </div>
          </>
        )}
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent scrollbar-thin scrollbar-thumb-fdvp-text/10 scrollbar-track-transparent">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-fdvp-text/50 gap-3">
            <Loader2 className="animate-spin text-fdvp-primary" size={24} />
            <span className="text-xs tracking-widest uppercase">Syncing...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-fdvp-text/40 gap-4">
            <div className="w-16 h-16 rounded-full bg-fdvp-text/5 flex items-center justify-center mb-2">
              <Send size={24} className="opacity-50" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-fdvp-text/60 mb-1">No messages yet</p>
              <p className="text-xs text-fdvp-text/40">Say hello!</p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === myId;
            const isSelected = selectedMessages.has(msg.id);
            const isEditing = editingMessageId === msg.id;

            return (
              <div
                key={idx}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 ${isSelected ? 'bg-fdvp-primary/5 -mx-2 px-2 py-1 rounded-lg' : ''}`}
                onClick={() => selectionMode && toggleSelection(msg.id)} // Desktop click
                onTouchStart={() => handleTouchStart(msg)}
                onTouchEnd={handleTouchEnd}
                onMouseDown={() => handleTouchStart(msg)} // Desktop long press
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
              >
                {/* Reply Indicator in Message */}
                {msg.replyToText && !isEditing && (
                  <div className={`text-[10px] mb-1 px-2 py-1 rounded border-l-2 opacity-70 truncate max-w-[200px] ${isMe ? 'border-fdvp-bg/50 bg-black/10' : 'border-fdvp-primary bg-fdvp-text/5'}`}>
                    Replying to: {msg.replyToText}
                  </div>
                )}

                {isEditing ? (
                  // Edit Mode
                  <div className="w-full max-w-[80%] min-w-[200px]">
                    <div className="flex items-center gap-2 bg-fdvp-card border border-fdvp-primary/50 rounded-2xl p-2 shadow-xl">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 bg-transparent text-fdvp-text-light text-sm px-2 py-1 border-none focus:outline-none"
                        autoFocus
                      />
                      <button onClick={saveEdit} className="p-1.5 bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-white rounded-full transition-all"><Check size={14} /></button>
                      <button onClick={cancelEdit} className="p-1.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-full transition-all"><X size={14} /></button>
                    </div>
                  </div>
                ) : (
                  // Normal Message
                  <div className="flex items-end gap-2 group relative">
                    {selectionMode && (
                      <button onClick={() => toggleSelection(msg.id)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-fdvp-primary border-fdvp-primary' : 'border-fdvp-text/30'}`}>
                        {isSelected && <Check size={12} className="text-white" />}
                      </button>
                    )}

                    <div className={`relative max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm backdrop-blur-md ${isMe
                      ? 'bg-fdvp-primary text-fdvp-bg rounded-br-sm'
                      : 'bg-fdvp-text/10 text-fdvp-text-light rounded-bl-sm border border-fdvp-text/5'
                      }`}>

                      <span className="block leading-relaxed whitespace-pre-wrap" style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}>
                        {msg.text}
                      </span>

                      <div className={`flex items-center gap-1 mt-1 justify-end ${isMe ? "text-fdvp-bg/60" : "text-fdvp-text"}`}>
                        <span className="text-[9px] font-mono opacity-80">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && <CheckCheck size={12} className={msg.isRead ? "text-fdvp-bg" : "text-fdvp-bg/40"} />}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}

        {isTyping && (
          <div className="flex justify-start animate-in fade-in slide-in-from-left-2 pl-1">
            <div className="bg-fdvp-text/5 border border-fdvp-text/5 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 shadow-sm items-center">
              <span className="w-1.5 h-1.5 bg-fdvp-primary rounded-full animate-[bounce_1s_infinite_0ms]"></span>
              <span className="w-1.5 h-1.5 bg-fdvp-primary rounded-full animate-[bounce_1s_infinite_200ms]"></span>
              <span className="w-1.5 h-1.5 bg-fdvp-primary rounded-full animate-[bounce_1s_infinite_400ms]"></span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-3 bg-transparent">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="mb-2 mx-2 p-2 bg-fdvp-text/5 border-l-2 border-fdvp-primary rounded-r flex justify-between items-center animate-in slide-in-from-bottom-2">
            <div className="text-xs text-fdvp-text-light overflow-hidden">
              <span className="text-fdvp-primary font-bold block mb-0.5">Replying to {replyingTo.senderName}</span>
              <span className="opacity-70 truncate block max-w-[200px]">{replyingTo.text}</span>
            </div>
            <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-fdvp-text/10 rounded-full"><X size={14} className="text-fdvp-text/50" /></button>
          </div>
        )}

        <form onSubmit={sendMessage} className="relative flex items-center gap-2 bg-fdvp-text/5 p-1.5 rounded-full border border-fdvp-text/10 shadow-lg focus-within:border-fdvp-primary/50 focus-within:bg-fdvp-text/10 transition-all">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 bg-transparent text-fdvp-text-light text-sm px-4 py-2 border-none focus:outline-none placeholder:text-fdvp-text/30"
          />
          <button
            type="submit"
            className="p-2.5 bg-fdvp-primary hover:bg-fdvp-primary/80 hover:text-fdvp-bg text-fdvp-bg rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
            disabled={!input.trim()}
          >
            <Send size={16} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}