"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Mail, Instagram, CheckCircle2, Clock, ScanLine } from "lucide-react";
import Link from "next/link";

export default function EventParticipantsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchParticipants = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/registrations/event/${id}`);
                if (!res.ok) return;

                const data = await res.json();
                if (Array.isArray(data)) {
                    setParticipants(data);
                } else {
                    setParticipants([]);
                }
            } catch (error) {
                console.error("Gagal fetch peserta:", error);
                setParticipants([]);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchParticipants();
        }
    }, [id]);

    // Stats Logic
    const total = participants.length;
    const scanned = participants.filter(p => p.status === 'confirmed' || p.status === 'attended').length;
    const pending = total - scanned;

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* NAVIGATION HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full border border-fdvp-text/10 bg-fdvp-text/5 hover:bg-fdvp-text/10 text-fdvp-text transition-all">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-fdvp-text-light tracking-tight">Participants List</h1>
                        <p className="text-fdvp-text text-sm">Monitor attendance and ticket status.</p>
                    </div>
                </div>

                <Link href="/dashboard/scan">
                    <button className="px-6 py-3 rounded-full bg-fdvp-primary text-fdvp-bg font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-fdvp-primary/20">
                        <ScanLine size={18} /> Open Scanner
                    </button>
                </Link>
            </div>

            {/* STATS OVERVIEW */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-fdvp-card border border-fdvp-text/10 p-5 rounded-2xl flex flex-col gap-1">
                    <span className="text-xs uppercase font-bold text-fdvp-text/40 tracking-widest">Total Registered</span>
                    <span className="text-3xl font-bold text-white">{total}</span>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 p-5 rounded-2xl flex flex-col gap-1">
                    <span className="text-xs uppercase font-bold text-green-400 tracking-widest flex items-center gap-2"><CheckCircle2 size={12} /> Checked In</span>
                    <span className="text-3xl font-bold text-green-400">{scanned}</span>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl flex flex-col gap-1">
                    <span className="text-xs uppercase font-bold text-amber-500 tracking-widest flex items-center gap-2"><Clock size={12} /> Pending</span>
                    <span className="text-3xl font-bold text-amber-500">{pending}</span>
                </div>
            </div>

            {/* LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-fdvp-primary" size={32} /></div>
                ) : participants.length === 0 ? (
                    <div className="col-span-full text-center py-20 border border-dashed border-fdvp-text/10 rounded-2xl text-fdvp-text/40">No participants found.</div>
                ) : (
                    participants.map((p) => {
                        const isScanned = p.status === 'confirmed' || p.status === 'attended';
                        return (
                            <div key={p.registrationId} className={`group relative bg-fdvp-card p-5 rounded-2xl border transition-all ${isScanned ? 'border-green-500/30 bg-green-500/5' : 'border-fdvp-text/10 hover:border-fdvp-text/30'}`}>
                                <div className="flex items-start gap-4">
                                    {/* Avatar */}
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${isScanned ? 'bg-green-500 text-black' : 'bg-fdvp-text/10 text-fdvp-text'}`}>
                                        {p.displayName.charAt(0).toUpperCase()}
                                    </div>

                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-fdvp-text-light truncate pr-2">{p.displayName}</h3>
                                                <p className="text-xs text-fdvp-primary uppercase font-bold tracking-wide">{p.job || "Member"}</p>
                                            </div>
                                            {isScanned ? (
                                                <div className="bg-green-500 text-black p-1 rounded-full" title="Scanned / Checked In">
                                                    <CheckCircle2 size={16} />
                                                </div>
                                            ) : (
                                                <div className="bg-fdvp-text/10 text-fdvp-text/40 p-1 rounded-full" title="Pending">
                                                    <Clock size={16} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 space-y-2">
                                            <div className="flex items-center gap-2 text-xs text-fdvp-text truncate opacity-70">
                                                <Mail size={12} /> {p.email}
                                            </div>
                                            {p.instagram && p.instagram !== '-' && (
                                                <div className="flex items-center gap-2 text-xs text-fdvp-text opacity-70">
                                                    <Instagram size={12} /> @{p.instagram}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-fdvp-text/5 flex justify-between items-center">
                                            <span className="text-[10px] text-fdvp-text/40 font-mono">Reg: {new Date(p.registrationDate).toLocaleDateString()}</span>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${isScanned ? 'bg-green-500/20 text-green-400' : 'bg-fdvp-text/10 text-fdvp-text/50'}`}>
                                                {isScanned ? 'CHECKED IN' : 'PENDING'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}