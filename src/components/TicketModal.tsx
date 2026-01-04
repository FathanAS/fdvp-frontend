"use client";
import { X, Calendar, MapPin, User, Mail } from "lucide-react";
import QRCode from "react-qr-code";

interface TicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticket: any; // Data tiket yang dipilih
}

export default function TicketModal({ isOpen, onClose, ticket }: TicketModalProps) {
    if (!isOpen || !ticket) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            {/* Container Tiket */}
            <div className="bg-white text-black w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative">

                {/* Tombol Close */}
                <button onClick={onClose} className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 p-2 rounded-full transition-colors z-10">
                    <X size={20} className="text-black" />
                </button>

                {/* BAGIAN ATAS: EVENT INFO */}
                <div className="bg-[#0D7377] p-6 text-white relative overflow-hidden">
                    {/* Dekorasi Circle */}
                    <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

                    <h3 className="text-sm text-white font-mono opacity-80 mb-1">E-TICKET / BOARDING PASS</h3>
                    <h2 className="text-2xl text-white font-bold leading-tight mb-4">{ticket.eventTitle}</h2>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="opacity-70 text-xs uppercase text-white mb-1 flex items-center gap-1"><Calendar size={10} /> Date</p>
                            <p className="font-bold text-white">{new Date(ticket.eventDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            <p className="text-xs text-white">{new Date(ticket.eventDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                        </div>
                        <div>
                            <p className="opacity-70 text-xs uppercase text-white mb-1 flex items-center gap-1"><MapPin size={10} /> Location</p>
                            <p className="font-bold text-white line-clamp-2">{ticket.eventLocation}</p>
                        </div>
                    </div>
                </div>

                {/* BAGIAN TENGAH: GARIS PUTUS (TEAR LINE) */}
                <div className="relative bg-white h-8">
                    <div className="absolute top-1/2 left-0 w-full border-t-2 border-dashed border-gray-300 -translate-y-1/2"></div>
                    {/* Lingkaran "Sobekan" Kiri Kanan */}
                    <div className="absolute top-1/2 -left-3 w-6 h-6 bg-black rounded-full -translate-y-1/2"></div>
                    <div className="absolute top-1/2 -right-3 w-6 h-6 bg-black rounded-full -translate-y-1/2"></div>
                </div>

                {/* BAGIAN BAWAH: QR CODE & USER INFO */}
                <div className="bg-white p-6 pt-2 flex flex-col items-center text-center">

                    {/* QR CODE GENERATOR */}
                    <div className="p-2 border-2 border-black rounded-xl mb-4">
                        {/* Value QR adalah Registration ID. Nanti admin scan ini. */}
                        <QRCode
                            value={ticket.registrationId}
                            size={150}
                            fgColor="#000000"
                            bgColor="#ffffff"
                        />
                    </div>
                    <p className="text-xs text-gray-400 font-mono mb-6">ID: {ticket.registrationId}</p>

                    {/* DETAIL USER */}
                    <div className="w-full bg-gray-50 rounded-xl p-4 text-left grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-800 uppercase mb-1">Attendee</p>
                            <p className="font-bold text-sm truncate text-black">{ticket.displayName || "Member FDVP"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-800 uppercase mb-1">Status</p>
                            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded border border-green-200">
                                {ticket.status.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <p className="text-[10px] text-gray-400 mt-6">
                        Tunjukkan QR Code ini di pintu masuk. Screenshot layar ini untuk akses offline.
                    </p>
                </div>
            </div>
        </div>
    );
}