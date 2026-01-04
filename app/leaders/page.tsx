"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Loader2, MessageCircle, Instagram, User, Search, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ChatWindow from "@/components/ChatWindow";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function LeadersPage() {
    const { user } = useAuth();
    const [leaders, setLeaders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState("");

    // Chat State
    const [activeChat, setActiveChat] = useState<{ id: string, name: string, photoURL: string } | null>(null);

    useEffect(() => {
        setLoading(true);
        // Roles that define leadership
        const staffRoles = ['owner', 'administrator', 'superadmin', 'admin', 'staff', 'manager'];

        const q = query(collection(db, "users"), where('role', 'in', staffRoles));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedLeaders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Custom sort: Owner -> SuperAdmin -> Admin -> Manager -> Staff
            const roleOrder: Record<string, number> = {
                'owner': 0, 'administrator': 1, 'superadmin': 1, 'admin': 2, 'manager': 3, 'staff': 4
            };

            fetchedLeaders.sort((a: any, b: any) => {
                const orderA = roleOrder[a.role] ?? 99;
                const orderB = roleOrder[b.role] ?? 99;
                return orderA - orderB;
            });

            setLeaders(fetchedLeaders);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Helper for random colors
    const getRandomColor = (name: string) => {
        const colors = ['bg-rose-500', 'bg-blue-500', 'bg-teal-500', 'bg-amber-500', 'bg-violet-500', 'bg-fuchsia-500'];
        const index = (name || "U").length % colors.length;
        return colors[index];
    };

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8; // Limit per page

    useEffect(() => {
        setCurrentPage(1);
    }, [keyword]);

    const filteredLeaders = leaders.filter(l =>
        (l.displayName || "").toLowerCase().includes(keyword.toLowerCase()) ||
        (l.job || "").toLowerCase().includes(keyword.toLowerCase())
    );

    const totalPages = Math.ceil(filteredLeaders.length / itemsPerPage);
    const paginatedLeaders = filteredLeaders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <main className="min-h-screen bg-fdvp-bg text-fdvp-text-light">
            <Navbar />

            <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                {/* HEADERS */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                        Community <span className="text-fdvp-primary">Leadership</span>
                    </h1>
                    <p className="text-fdvp-text max-w-2xl mx-auto text-lg mb-8">
                        The dedicated individuals guiding and managing our community.
                    </p>

                    {/* SEARCH */}
                    <div className="max-w-md mx-auto relative">
                        <input
                            type="text"
                            placeholder="Search leaders..."
                            className="w-full bg-fdvp-card border border-fdvp-text/20 rounded-full py-3 pl-12 pr-4 text-fdvp-text-light focus:outline-none focus:border-fdvp-primary transition-all shadow-sm"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                        <Search className="absolute left-4 top-3.5 text-fdvp-text/50" size={20} />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-20">
                        <Loader2 className="animate-spin text-fdvp-primary" size={48} />
                    </div>
                ) : filteredLeaders.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        No leaders found matching your search.
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {paginatedLeaders.map((person) => (
                                <div key={person.id} className="group relative bg-fdvp-text/5 hover:bg-fdvp-text/10 border border-fdvp-text/5 hover:border-fdvp-text/20 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1">

                                    {/* Badge */}
                                    <div className="absolute top-4 right-4 z-20">
                                        <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${person.role === 'owner' ? "bg-purple-500/20 text-purple-300 border-purple-500/30" :
                                            person.role === 'administrator' || person.role === 'superadmin' ? "bg-red-500/20 text-red-300 border-red-500/30" :
                                                "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                            }`}>
                                            {person.role}
                                        </span>
                                    </div>

                                    <div className="flex flex-col items-center mt-2">
                                        <div className="relative w-28 h-28 mb-5 rounded-full p-1 group-hover:scale-105 transition-transform">
                                            {/* Glow */}
                                            <div className="absolute inset-0 bg-fdvp-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                            <div className="relative w-full h-full rounded-full overflow-hidden bg-fdvp-card border-4 border-fdvp-bg shadow-lg">
                                                {person.photoURL ? (
                                                    <img src={person.photoURL} alt={person.displayName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className={`w-full h-full flex items-center justify-center text-3xl font-bold text-white ${getRandomColor(person.displayName)}`}>
                                                        {(person.displayName || "S").charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-bold text-fdvp-text-light mb-1 group-hover:text-fdvp-primary transition-colors text-center px-2">
                                            {person.displayName || "Unknown"}
                                        </h3>
                                        <p className="text-sm text-fdvp-text/60 text-center mb-6 h-5">
                                            {person.job || "Core Team"}
                                        </p>

                                        <div className="flex gap-2 w-full">
                                            {/* Chat Action (If accessible) */}
                                            {!['owner', 'administrator', 'superadmin'].includes(person.role) && user?.uid !== person.id && (
                                                <button
                                                    onClick={() => setActiveChat({
                                                        id: person.id,
                                                        name: person.displayName,
                                                        photoURL: person.photoURL
                                                    })}
                                                    className="flex-1 py-2.5 bg-fdvp-primary text-white hover:bg-fdvp-accent rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-fdvp-primary/20"
                                                >
                                                    <MessageCircle size={16} /> Chat
                                                </button>
                                            )}

                                            <a href={`/profile?id=${person.id}`} className="py-2.5 px-4 bg-fdvp-text/10 hover:bg-fdvp-text/20 text-fdvp-text-light rounded-xl transition-all flex items-center justify-center">
                                                <User size={18} />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 0 && (
                            <div className="flex justify-center items-center gap-4 mt-12 pb-8">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    className="px-4 py-2 rounded-lg bg-fdvp-card border border-fdvp-text/10 text-fdvp-text hover:bg-fdvp-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-bold"
                                >
                                    Previous
                                </button>

                                <div className="flex gap-2">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all text-sm font-bold ${currentPage === page
                                                ? 'bg-fdvp-primary text-white shadow-lg shadow-fdvp-primary/20'
                                                : 'bg-transparent text-fdvp-text hover:bg-fdvp-text/10'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    className="px-4 py-2 rounded-lg bg-fdvp-card border border-fdvp-text/10 text-fdvp-text hover:bg-fdvp-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-bold"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Chat Window */}
            {activeChat && user && (
                <ChatWindow
                    myId={user.uid}
                    myName={user.displayName || user.email || "Me"}
                    myPhoto={user.photoURL}
                    otherUser={activeChat}
                    onClose={() => setActiveChat(null)}
                />
            )}
        </main>
    );
}
