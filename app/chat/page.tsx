"use client";
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, limit, getDocs, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import ChatWindow from "@/components/ChatWindow";
import { Search, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

import { useRouter } from "next/navigation";

export default function ChatPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { t } = useLanguage();
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedContact, setSelectedContact] = useState<any>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
            return;
        }
        if (!user) return;

        setLoading(true);

        // 1. Listen to Firestore "conversations" (Realtime Updates for Contact List)
        const conversationsRef = collection(db, "conversations", user.uid, "active");
        const q = query(conversationsRef, orderBy("timestamp", "desc"));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const promises = snapshot.docs.map(async (docSnap) => {
                const chatData = docSnap.data();
                const partnerId = chatData.partnerId || chatData.uid;

                let displayData = {
                    id: partnerId,
                    displayName: chatData.partnerName || "Unknown",
                    photoURL: chatData.partnerPhoto || "",
                    lastMessage: chatData.lastMessage,
                    timestamp: chatData.timestamp,
                    job: "Member",
                    uid: chatData.uid,
                    isOnline: false, // Default status
                    lastSeen: null
                };

                // Fetch fresh User Profile & Status
                try {
                    const userDocRef = doc(db, "users", partnerId);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        displayData.displayName = userData.displayName || displayData.displayName;
                        displayData.photoURL = userData.photoURL || displayData.photoURL;
                        displayData.job = userData.job || userData.role || "Member";
                        displayData.isOnline = userData.isOnline || false;
                        displayData.lastSeen = userData.lastSeen || null;
                    }
                } catch (e) {
                    console.warn("Failed to fetch user details", e);
                }

                return displayData;
            });

            const results = await Promise.all(promises);
            setContacts(results);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading]);

    // 2. Global Socket Listener for Realtime Status Updates in List
    useEffect(() => {
        if (!user) return;
        const socket = io(process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:3001", {
            transports: ["websocket"],
            query: { userId: user.uid },
            reconnection: true
        });

        socket.on('userStatus', (data: { userId: string; isOnline: boolean; lastSeen?: string }) => {
            setContacts(prev => prev.map(c =>
                c.id === data.userId
                    ? { ...c, isOnline: data.isOnline, lastSeen: data.lastSeen }
                    : c
            ));
        });

        // Listen for new messages to update "lastMessage" instantly even if Firestore is lagging slightly
        socket.on('receiveMessage', (msg: any) => {
            // Optional: You could optimistically update the contact list order here 
            // but Firestore onSnapshot usually handles this fast enough if Backend updates the doc.
            // We'll trust Firestore + Manual Sync backup.
        });

        return () => {
            socket.disconnect();
        }
    }, [user]);

    const handleSyncChats = async () => {
        setLoading(true);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/chat/sync-conversations`);
            // data will update via snapshot automatically
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="h-screen bg-fdvp-bg text-fdvp-text-light flex flex-col overflow-hidden">
            <Navbar />

            <div className="flex-1 flex max-w-7xl mx-auto w-full pt-20 h-full overflow-hidden">

                {/* SIDEBAR: CONTACT LIST */}
                <div className={`w-full md:w-1/3 border-r border-fdvp-accent/10 flex flex-col bg-fdvp-card h-full ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-fdvp-accent/10 flex-shrink-0">
                        <h2 className="text-xl font-bold mb-4">{t.chat.messages}</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fdvp-text/50" size={18} />
                            <input
                                type="text"
                                placeholder={t.chat.searchPlaceholder}
                                className="w-full bg-fdvp-bg rounded-lg py-2 pl-10 pr-4 text-sm text-fdvp-text-light focus:outline-none focus:ring-1 focus:ring-fdvp-accent"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-fdvp-accent/20 scrollbar-track-transparent">
                        {loading ? (
                            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-fdvp-accent" /></div>
                        ) : filteredContacts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 opacity-70">
                                <p className="text-sm text-fdvp-text mb-4">{t.chat.noConversations}</p>
                                <button
                                    onClick={handleSyncChats}
                                    className="text-xs bg-fdvp-primary/20 text-fdvp-primary px-3 py-1 rounded-full hover:bg-fdvp-primary hover:text-white transition-colors"
                                >
                                    {t.chat.syncChat}
                                </button>
                            </div>
                        ) : (
                            filteredContacts.map(contact => (
                                <div
                                    key={contact.id}
                                    onClick={() => setSelectedContact(contact)}
                                    className={`p-4 flex items-center gap-3 cursor-pointer transition-colors hover:bg-fdvp-text/5 ${selectedContact?.id === contact.id ? 'bg-fdvp-primary/10 border-r-2 border-fdvp-accent' : ''}`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-fdvp-bg overflow-hidden flex-shrink-0">
                                        {contact.photoURL ? (
                                            <img src={contact.photoURL} alt={contact.displayName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-bold text-fdvp-text bg-fdvp-accent/10">
                                                {contact.displayName?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h3 className="font-bold truncate text-sm">{contact.displayName || "Unknown"}</h3>
                                            {contact.timestamp && (
                                                <span className="text-[10px] text-fdvp-text/50">
                                                    {new Date(contact.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-fdvp-text truncate flex items-center gap-1">
                                            {/* Show user ID/Job if no message, else show last message */}
                                            {contact.uid === user?.uid && <span className="text-fdvp-primary">You:</span>}
                                            {contact.lastMessage || contact.job || "Member"}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* MAIN CHAT AREA */}
                <div className={`flex-1 flex flex-col bg-fdvp-bg h-full overflow-hidden ${!selectedContact ? 'hidden md:flex' : 'flex'}`}>
                    {selectedContact ? (
                        user && (
                            <div className="h-full flex flex-col w-full">
                                {/* Mobile Back Button */}
                                <div className="md:hidden p-2 bg-fdvp-card flex items-center flex-shrink-0">
                                    <button onClick={() => setSelectedContact(null)} className="text-fdvp-accent text-sm font-bold">
                                        &larr; {t.chat.back}
                                    </button>
                                </div>

                                <ChatWindow
                                    myId={user.uid}
                                    myName={user.displayName || user.email || "Me"}
                                    myPhoto={user.photoURL}
                                    otherUser={{
                                        id: selectedContact.id,
                                        name: selectedContact.displayName || "User",
                                        photoURL: selectedContact.photoURL || ""
                                    }}
                                    onClose={() => setSelectedContact(null)}
                                    // FORCE H-FULL to ensure chat window respects container height
                                    customClass="h-full border-none rounded-none shadow-none w-full flex-1"
                                />
                            </div>
                        )
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                            <div className="p-6 rounded-full bg-fdvp-card mb-4">
                                <Search size={48} className="text-fdvp-accent" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">{t.chat.selectConv}</h2>
                            <p>{t.chat.selectConvDesc}</p>
                        </div>
                    )}
                </div>

            </div>
        </main>
    );
}
