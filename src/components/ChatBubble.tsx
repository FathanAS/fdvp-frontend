"use client";
import { useState, useRef, useEffect } from "react";
import { Check, CheckCheck, Loader2, MoreVertical, Copy, Trash2, Reply, Ban } from "lucide-react";
import { format } from "date-fns";

interface Message {
    id: string;
    senderId: string;
    senderName: string;
    senderPhoto?: string;
    text: string;
    createdAt: string;
    isRead?: boolean;
    replyTo?: string | null;
    replyToText?: string | null;
    status?: 'sending' | 'sent' | 'failed';
    isDeleted?: boolean; // New field for "Delete for Everyone" content check logic
}

interface ChatBubbleProps {
    msg: Message;
    isMe: boolean;
    isSelectionMode: boolean;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onReply: (msg: Message) => void;
    onCopy: (text: string) => void;
    onDeleteForMe: (id: string) => void;
    onDeleteForEveryone: (id: string) => void;
}

export default function ChatBubble({
    msg,
    isMe,
    isSelectionMode,
    isSelected,
    onSelect,
    onReply,
    onCopy,
    onDeleteForMe,
    onDeleteForEveryone
}: ChatBubbleProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Determine content based on deleted status
    // Assuming the backend updates `text` to specific string or we add `type: 'deleted'`
    // For now, checking text content or flag
    const isDeletedContent = msg.text === "🚫 This message was deleted" || msg.isDeleted;

    return (
        <div
            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 ${isSelected ? 'bg-fdvp-primary/5 -mx-2 px-2 py-1 rounded-lg' : ''} mb-2 relative`}
        >
            {/* Reply Indicator */}
            {msg.replyToText && !isDeletedContent && (
                <div className={`text-[10px] mb-1 px-2 py-1 rounded border-l-2 opacity-70 truncate max-w-[200px] ${isMe ? 'border-fdvp-bg/50 bg-black/10' : 'border-fdvp-primary bg-fdvp-text/5'}`}>
                    Replying to: {msg.replyToText}
                </div>
            )}

            <div className="flex items-end gap-2 group relative max-w-full">
                {/* Selection Checkbox */}
                {isSelectionMode && (
                    <button
                        onClick={() => onSelect(msg.id)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-fdvp-primary border-fdvp-primary' : 'border-fdvp-text/30'}`}
                    >
                        {isSelected && <Check size={12} className="text-white" />}
                    </button>
                )}

                {/* Message Bubble */}
                <div className={`relative px-4 py-2.5 text-sm shadow-sm backdrop-blur-md 
          max-w-[75%] md:max-w-[60%]
          ${isDeletedContent ? 'italic opacity-60 bg-gray-200 dark:bg-gray-800 text-gray-500 border border-gray-300' :
                        isMe ? 'bg-fdvp-primary text-fdvp-bg rounded-2xl rounded-br-sm' :
                            'bg-fdvp-text/10 text-fdvp-text-light rounded-2xl rounded-bl-sm border border-fdvp-text/5'}
        `}>

                    {/* Text Content */}
                    <span className="block leading-relaxed whitespace-pre-wrap break-words" style={{ wordBreak: 'break-word', padding: '0px' }}>
                        {isDeletedContent ? (
                            <span className="flex items-center gap-1"><Ban size={12} /> This message was deleted</span>
                        ) : msg.text}
                    </span>

                    {/* Footer: Time & Status */}
                    <div className={`flex items-center gap-1 mt-1 justify-end ${isMe ? "text-fdvp-bg/60" : "text-fdvp-text"}`}>
                        <span className="text-[9px] font-mono opacity-80">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && !isDeletedContent && (
                            <div className="flex items-center">
                                {msg.status === 'sending' ? (
                                    <Loader2 size={10} className="animate-spin text-fdvp-text/50 mr-1" />
                                ) : (
                                    <CheckCheck size={12} className={msg.isRead ? "text-fdvp-bg" : "text-fdvp-bg/40"} />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Dropdown Trigger (Hover only or Always on Mobile?) - Making it appear on hover or click */}
                    {!isSelectionMode && !isDeletedContent && (
                        <div className="absolute top-0 right-0 -mr-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
                                className="p-1.5 bg-fdvp-card/80 rounded-full shadow-sm hover:bg-fdvp-card text-fdvp-text/70"
                            >
                                <MoreVertical size={14} />
                            </button>

                            {/* DROPDOWN MENU */}
                            {showDropdown && (
                                <div
                                    ref={dropdownRef}
                                    className="absolute top-6 right-0 w-40 bg-fdvp-card border border-fdvp-text/10 rounded-xl shadow-xl z-50 overflow-hidden animate-in zoom-in-95 duration-100"
                                    style={{ minWidth: '150px' }}
                                >
                                    <button onClick={() => { onReply(msg); setShowDropdown(false); }} className="w-full text-left px-4 py-2.5 text-xs hover:bg-fdvp-text/5 flex items-center gap-2 text-fdvp-text-light">
                                        <Reply size={14} /> Reply
                                    </button>
                                    <button onClick={() => { onCopy(msg.text); setShowDropdown(false); }} className="w-full text-left px-4 py-2.5 text-xs hover:bg-fdvp-text/5 flex items-center gap-2 text-fdvp-text-light">
                                        <Copy size={14} /> Copy
                                    </button>

                                    <div className="h-px bg-fdvp-text/5 my-1" />

                                    <button onClick={() => { onDeleteForMe(msg.id); setShowDropdown(false); }} className="w-full text-left px-4 py-2.5 text-xs hover:bg-red-500/10 text-red-500 flex items-center gap-2">
                                        <Trash2 size={14} /> Delete for me
                                    </button>

                                    {isMe && (
                                        <button onClick={() => { onDeleteForEveryone(msg.id); setShowDropdown(false); }} className="w-full text-left px-4 py-2.5 text-xs hover:bg-red-500/10 text-red-500 flex items-center gap-2">
                                            <Trash2 size={14} /> Delete for everyone
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
