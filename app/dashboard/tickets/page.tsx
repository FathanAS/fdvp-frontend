"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Mail, ShieldCheck, User, Clock, AlertCircle } from 'lucide-react';

export default function TicketsInbox() {
    const { user, role } = useAuth();
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Only allow staff/admin
        if (user && role && ['admin', 'staff', 'superadmin', 'owner'].includes(role)) {
            fetchTickets();
        }
    }, [user, role]);

    const fetchTickets = async () => {
        try {
            if (!user) return;
            const token = await user.getIdToken();

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/tickets`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error("Failed to fetch");

            const data = await res.json();
            setTickets(data);
        } catch (err) {
            console.error("Failed to load tickets", err);
        } finally {
            setLoading(false);
        }
    }

    if (!['admin', 'staff', 'superadmin', 'owner'].includes(role || '')) {
        return <div className="p-20 text-center text-red-500 font-bold">Unauthorized Access</div>
    }

    return (
        <div className="min-h-screen bg-[#0b0c10] text-[#e0e0e0]">
            <div className="max-w-6xl mx-auto px-6 pt-10 pb-20">
                <header className="mb-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                            <ShieldCheck className="text-fdvp-primary" size={36} />
                            Executive Inbox
                        </h1>
                        <p className="text-gray-400">Secure channel communications and support tickets.</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-white">{tickets.length}</div>
                        <div className="text-xs uppercase tracking-wider text-gray-500 font-bold">Total Tickets</div>
                    </div>
                </header>

                {loading ? (
                    <div className="text-center py-20 text-gray-500 animate-pulse">Decrypting messages...</div>
                ) : tickets.length === 0 ? (
                    <div className="p-16 border border-white/5 rounded-3xl bg-[#14141e] text-center">
                        <Mail className="mx-auto text-gray-600 mb-4" size={48} />
                        <h3 className="text-xl font-bold text-gray-300">Clean Inbox</h3>
                        <p className="text-gray-500 mt-2">No pending secure messages at the moment.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {tickets.map((ticket) => (
                            <div key={ticket.id} className="relative group bg-[#14141e] border border-white/5 p-6 rounded-2xl hover:border-fdvp-primary/30 transition-all hover:translate-x-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border border-white/10 ${ticket.priority === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            ticket.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                            }`}>
                                            {ticket.priority?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{ticket.subject}</h3>
                                            <span className="text-xs text-fdvp-primary font-mono px-2 py-0.5 rounded bg-fdvp-primary/10 border border-fdvp-primary/10">
                                                {ticket.targetDepartment}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                                        <Clock size={12} />
                                        {new Date(ticket.createdAt).toLocaleString()}
                                    </span>
                                </div>

                                <p className="text-gray-300 text-sm leading-relaxed mb-6 pl-13 border-l-2 border-white/5 ml-5 pl-4">
                                    {ticket.message}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] uppercase font-bold text-gray-300">
                                            {ticket.displayName?.charAt(0) || '?'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-300">{ticket.displayName || 'Anonymous'}</span>
                                            <span className="text-[10px] text-gray-500">{ticket.email || 'No Email'}</span>
                                        </div>
                                    </div>

                                    <button className="px-4 py-2 bg-white/5 hover:bg-fdvp-primary text-gray-300 hover:text-white text-xs font-bold rounded-lg transition-colors border border-white/10">
                                        Mark as Resolved
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
