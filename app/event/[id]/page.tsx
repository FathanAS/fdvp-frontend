"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; // Hook untuk ambil ID dari URL
import Navbar from "@/components/Navbar";
import { Calendar, MapPin, User, ArrowLeft, Share2, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import MapViewer from "@/components/MapViewer";
import { useNotification } from "@/context/NotificationContext";
import Notiflix from "notiflix";
import ShareModal from "@/components/ShareModal"; // Import Modal

export default function EventDetailPage() {
    const { id } = useParams(); // Ambil ID event (misal: "7a8s9d...")
    const { notify } = useNotification();
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth(); // Cek status login user
    const [registering, setRegistering] = useState(false); // Untuk loading tombol
    const [isRegistered, setIsRegistered] = useState(false); // New State: Status Join

    // Share Modal State
    const [shareModal, setShareModal] = useState({
        isOpen: false,
        url: "",
        title: ""
    });

    // FETCH DETAIL EVENT
    useEffect(() => {
        if (!id) return;
        const fetchDetail = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/events/${id}`);
                if (!res.ok) throw new Error("Event not found");
                const data = await res.json();
                setEvent(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    // CHECK IF USER ALREADY REGISTERED
    useEffect(() => {
        if (!user || !id) return;
        const checkRegistration = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/registrations/user/${user.uid}`);
                if (res.ok) {
                    const myTickets = await res.json();
                    // Cek apakah ada tiket dengan eventId yang sama (compare as string)
                    const isJoined = myTickets.some((ticket: any) => String(ticket.eventId) === String(id));
                    setIsRegistered(isJoined);
                }
            } catch (error) {
                console.error("Gagal cek registrasi:", error);
            }
        };
        checkRegistration();
    }, [user, id]);

    const handleRegister = async () => {
        if (!user) {
            notify("Info", "Please login first to register.", "info");
            return;
        }

        Notiflix.Confirm.show(
            'Confirm Registration',
            `Apakah Anda yakin ingin mendaftar ke event "${event.title}"?`,
            'Yes, Register',
            'Cancel',
            async () => {
                setRegistering(true);

                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/registrations`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            eventId: event.id, // <--- PASTIKAN INI TIDAK UNDEFINED!
                            userId: user.uid,
                            userEmail: user.email,
                        }),
                    });

                    const data = await res.json();

                    if (!res.ok) {
                        throw new Error(data.message || "Gagal mendaftar");
                    }

                    notify("Success", "Congrats! You are registered.", "success");
                    setIsRegistered(true); // Update state jadi registered
                } catch (error: any) {
                    notify("Registration Failed", error.message, "error");
                } finally {
                    setRegistering(false);
                }
            }
        );
    };

    const handleShare = () => {
        if (!event) return;
        const url = window.location.href;
        setShareModal({
            isOpen: true,
            url: url,
            title: event.title
        });
    };

    if (loading) return (
        <div className="h-screen bg-fdvp-bg flex items-center justify-center">
            <Loader2 className="animate-spin text-fdvp-accent" size={48} />
        </div>
    );

    if (!event) return (
        <div className="h-screen bg-fdvp-bg flex flex-col items-center justify-center text-fdvp-text-light">
            <h1 className="text-4xl font-bold mb-4">404</h1>
            <p>Event tidak ditemukan.</p>
            <Link href="/event" className="text-fdvp-accent mt-4 underline">Kembali ke List</Link>
        </div>
    );

    return (
        <main className="min-h-screen bg-fdvp-bg text-fdvp-text-light pb-20">
            <Navbar />

            <ShareModal
                isOpen={shareModal.isOpen}
                onClose={() => setShareModal({ ...shareModal, isOpen: false })}
                url={shareModal.url}
                title={shareModal.title}
            />

            {/* HERO IMAGE BANNER */}
            <div className="relative h-[50vh] w-full">
                <div className="absolute inset-0 bg-gradient-to-t from-fdvp-bg via-transparent to-transparent z-10"></div>
                <img
                    src={event.imageHeader}
                    alt={event.title}
                    className="w-full h-full object-cover"
                />

                {/* Tombol Back Floating */}
                <Link href="/event" className="absolute top-24 left-6 z-20 bg-black/50 backdrop-blur-md p-3 rounded-full hover:bg-fdvp-primary transition-all text-white">
                    <ArrowLeft size={24} />
                </Link>
            </div>

            {/* CONTENT CONTAINER */}
            <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-20">

                {/* TITLE CARD */}
                <div className="bg-fdvp-card p-8 rounded-2xl border border-fdvp-text/10 shadow-2xl mb-8">
                    <div className="flex justify-between items-start mb-4">
                        <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border
                          ${event.status === 'upcoming' ? 'bg-green-500/20 text-green-400 border-green-500' : ''}
                          ${event.status === 'ongoing' ? 'bg-blue-500/20 text-blue-400 border-blue-500' : ''}
                          ${event.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border-red-500' : ''}
                          ${event.status === 'completed' ? 'bg-gray-500/20 text-gray-400 border-gray-500' : ''}
                          ${event.status === 'on_hold' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500' : ''}
                        `}>
                            {event.status.replace('_', ' ')}
                        </span>
                        <button
                            onClick={handleShare}
                            className="text-fdvp-text hover:text-fdvp-accent transition-colors p-2 hover:bg-fdvp-text/5 rounded-full"
                            title="Share Event"
                        >
                            <Share2 size={24} />
                        </button>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                        {event.title}
                    </h1>

                    {/* INFO GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-fdvp-text/10">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-fdvp-bg rounded-lg text-fdvp-primary">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-fdvp-text uppercase font-mono">Date & Time</p>
                                <p className="font-bold text-sm">
                                    {new Date(event.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-fdvp-bg rounded-lg text-fdvp-primary">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-fdvp-text uppercase font-mono">Location</p>
                                <p className="font-bold text-sm">{event.location}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-fdvp-bg rounded-lg text-fdvp-primary">
                                <User size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-fdvp-text uppercase font-mono">Organizer</p>
                                <p className="font-bold text-sm">FDVP Admin</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DESCRIPTION & CTA */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* LEFT: DESCRIPTION */}
                    <div className="md:col-span-2 space-y-6">
                        <h3 className="text-2xl font-bold text-fdvp-accent">About Event</h3>
                        <div className="text-fdvp-text leading-relaxed whitespace-pre-line text-lg">
                            {event.description}
                        </div>

                        {/* MAP VIEWER */}
                        {event.latitude !== 0 && (
                            <div className="mt-6">
                                <h4 className="font-bold text-fdvp-text-light mb-3">Event Location</h4>
                                <MapViewer lat={Number(event.latitude)} lng={Number(event.longitude)} />
                            </div>
                        )}
                    </div>

                    {/* RIGHT: ACTION CARD (STICKY) */}
                    <div className="relative">
                        <div className="sticky top-24 bg-fdvp-card p-6 rounded-xl border border-fdvp-accent/20">
                            <h4 className="font-bold mb-2">
                                {event.status === 'cancelled' ? 'Event Dibatalkan' :
                                    event.status === 'completed' ? 'Event Selesai' :
                                        isRegistered ? 'Status Registration' : 'Ready to join?'}
                            </h4>

                            {(event.status === 'upcoming' || event.status === 'ongoing') ? (
                                user ? (
                                    isRegistered ? (
                                        // JIKA SUDAH REGISTER
                                        <button disabled className="w-full bg-green-500/20 text-green-400 border border-green-500/30 font-bold py-4 rounded-lg cursor-not-allowed flex justify-center items-center gap-2">
                                            <CheckCircle2 size={20} /> ALREADY REGISTERED
                                        </button>
                                    ) : (
                                        // BELUM REGISTER
                                        <button
                                            onClick={handleRegister}
                                            disabled={registering}
                                            className="w-full bg-fdvp-primary hover:bg-fdvp-accent hover:text-fdvp-bg text-white font-bold py-4 rounded-lg transition-all shadow-lg hover:shadow-fdvp-accent/20 flex justify-center items-center gap-2"
                                        >
                                            {registering ? <Loader2 className="animate-spin" /> : "REGISTER NOW"}
                                        </button>
                                    )
                                ) : (
                                    <Link href="/login">
                                        <button className="w-full border border-fdvp-text/20 hover:border-fdvp-accent hover:text-fdvp-accent text-fdvp-text font-bold py-4 rounded-lg transition-all">
                                            LOGIN TO REGISTER
                                        </button>
                                    </Link>
                                )
                            ) : (
                                <button disabled className="w-full bg-fdvp-text/10 text-fdvp-text font-bold py-4 rounded-lg cursor-not-allowed border border-fdvp-text/10">
                                    {event.status === 'cancelled' ? 'REGISTRATION CLOSED' : 'EVENT ENDED'}
                                </button>
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </main>
    );
}