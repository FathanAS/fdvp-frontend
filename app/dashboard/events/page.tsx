"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Edit, Trash2, Users, Plus, Calendar, MapPin, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import Notiflix from "notiflix";

export default function AdminEventsPage() {
    const { user } = useAuth();
    const { notify } = useNotification();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // FETCH EVENTS
    const fetchEvents = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/events`);
            const data = await res.json();
            setEvents(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    // DELETE HANDLER
    const handleDelete = async (id: string, title: string) => {
        if (!user) return notify("Error", "You must be logged in to delete events!", "error");

        Notiflix.Confirm.show(
            'Delete Event',
            `Are you sure you want to delete "${title}"? This cannot be undone.`,
            'Yes, Delete',
            'Cancel',
            async () => {
                try {
                    // Kirim adminId lewat Query Param agar backend bisa mencatat siapa yang menghapus
                    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/events/${id}?adminId=${user.uid}`, {
                        method: "DELETE",
                    });
                    if (res.ok) {
                        notify("Success", "Event deleted successfully.", "success");
                        fetchEvents(); // Refresh tabel
                    } else {
                        const err = await res.text();
                        notify("Error", "Failed: " + err, "error");
                    }
                } catch (error) {
                    console.error(error);
                    notify("Error", "An error occurred while deleting event.", "error");
                }
            }
        );
    };

    // 1. HELPER: WARNA & LABEL STATUS
    const getStatusBadge = (status: string) => {
        const badgeClasses = "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border";
        switch (status) {
            case 'upcoming':
                return <span className={`${badgeClasses} bg-green-500/10 text-green-400 border-green-500/20`}>Upcoming</span>;
            case 'ongoing':
                return <span className={`${badgeClasses} bg-blue-500/10 text-blue-400 border-blue-500/20`}>Ongoing</span>;
            case 'completed':
                return <span className={`${badgeClasses} bg-white/5 text-white/40 border-white/10`}>Completed</span>;
            case 'on_hold':
                return <span className={`${badgeClasses} bg-yellow-500/10 text-yellow-400 border-yellow-500/20`}>On Hold</span>;
            case 'cancelled':
                return <span className={`${badgeClasses} bg-red-500/10 text-red-400 border-red-500/20`}>Cancelled</span>;
            default:
                return <span className={`${badgeClasses} bg-white/5 text-white/40 border-white/10`}>Draft</span>;
        }
    };

    if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-fdvp-primary" size={32} /></div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-fdvp-text-light tracking-tight">Manage Events</h1>
                    <p className="text-fdvp-text text-sm mt-1">Create and oversee community activities.</p>
                </div>
                <Link href="/dashboard/events/create">
                    <button className="bg-fdvp-primary text-fdvp-bg px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-fdvp-text-light hover:text-fdvp-bg hover:scale-105 transition-all shadow-lg shadow-fdvp-primary/20">
                        <Plus size={20} /> <span className="text-sm">New Event</span>
                    </button>
                </Link>
            </div>

            <div className="bg-fdvp-text/5 border border-fdvp-text/5 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-fdvp-text/5 text-fdvp-text/40 text-[10px] uppercase font-bold tracking-widest hidden md:table-header-group">
                            <tr>
                                <th className="p-6">Event Details</th>
                                <th className="p-6">Date & Location</th>
                                <th className="p-6">Status</th>
                                <th className="p-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-fdvp-text/5">
                            {events.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-10 text-center text-fdvp-text/40">No events found.</td>
                                </tr>
                            ) : (
                                events.map((event) => (
                                    <tr key={event.id} className="group hover:bg-fdvp-text/5 transition-colors duration-200 block md:table-row bg-fdvp-text/5 md:bg-transparent rounded-2xl mb-4 md:mb-0 border border-fdvp-text/5 md:border-0 p-4 md:p-0">
                                        <td className="p-0 md:p-6 block md:table-cell mb-4 md:mb-0 border-b md:border-b-0 border-fdvp-text/5 pb-4 md:pb-0">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-12 rounded-lg bg-fdvp-text/5 overflow-hidden border border-fdvp-text/5 shrink-0">
                                                    <img src={event.imageHeader} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-fdvp-text-light group-hover:text-fdvp-primary transition-colors text-sm">{event.title}</p>
                                                    <p className="text-xs text-fdvp-text/50 line-clamp-1 max-w-[200px] mt-1">{event.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-0 md:p-6 block md:table-cell mb-4 md:mb-0">
                                            <div className="flex flex-col md:block space-y-1.5 md:space-y-1.5 text-xs text-fdvp-text font-mono">
                                                <span className="md:hidden text-[10px] uppercase font-bold text-fdvp-text/50 mb-1 font-sans">Date & Location</span>
                                                <div className="flex items-center gap-2"><Calendar size={12} className="text-fdvp-primary" /> {new Date(event.date).toLocaleDateString()}</div>
                                                <div className="flex items-center gap-2"><MapPin size={12} className="text-fdvp-primary" /> {event.location}</div>
                                            </div>
                                        </td>
                                        <td className="p-0 md:p-6 block md:table-cell mb-4 md:mb-0">
                                            <div className="flex flex-col md:block">
                                                <span className="md:hidden text-[10px] uppercase font-bold text-fdvp-text/50 mb-2">Status</span>
                                                <div>{getStatusBadge(event.status)}</div>
                                            </div>
                                        </td>
                                        <td className="p-0 md:p-6 text-right block md:table-cell">
                                            <div className="flex justify-end pt-2 md:pt-0 border-t md:border-t-0 border-fdvp-text/5 gap-2 transition-opacity">
                                                {/* LIHAT PESERTA */}
                                                <Link href={`/dashboard/events/${event.id}/participants`} title="View Participants">
                                                    <button className="p-2 hover:bg-blue-500/20 text-fdvp-text/40 hover:text-blue-400 rounded-lg transition-all">
                                                        <Users size={18} />
                                                    </button>
                                                </Link>

                                                {/* EDIT */}
                                                <Link href={`/dashboard/events/${event.id}/edit`}>
                                                    <button className="p-2 hover:bg-yellow-500/20 text-fdvp-text/40 hover:text-yellow-400 rounded-lg transition-all" title="Edit Event">
                                                        <Edit size={18} />
                                                    </button>
                                                </Link>

                                                {/* DELETE */}
                                                <button
                                                    onClick={() => handleDelete(event.id, event.title)}
                                                    className="p-2 hover:bg-red-500/20 text-fdvp-text/40 hover:text-red-400 rounded-lg transition-all"
                                                    title="Delete Event"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}