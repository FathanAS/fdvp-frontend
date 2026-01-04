"use client";
import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { CheckCircle2, XCircle, RefreshCw, Loader2, ArrowLeft, ScanLine, ArrowRight, User, Briefcase, Ticket, Calendar, Clock } from "lucide-react";
import Link from "next/link";

export default function ScanPage() {
    const [scanResult, setScanResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [pauseScan, setPauseScan] = useState(false);
    const [manualId, setManualId] = useState("");

    // FUNGSI SAAT QR TERDETEKSI
    const handleScan = async (result: string) => {
        if (!result || pauseScan) return;

        setPauseScan(true);
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/registrations/validate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ qrCode: result }),
            });

            const data = await res.json();
            setScanResult(data);

        } catch (error) {
            console.error("Error Validasi:", error);
            setScanResult({ valid: false, message: "Connection error. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    // FUNGSI RESET UNTUK SCAN BERIKUTNYA
    const handleReset = () => {
        setScanResult(null);
        setPauseScan(false);
        setManualId("");
    };

    return (
        <div className="min-h-screen bg-fdvp-bg text-fdvp-text-light flex flex-col relative">

            {/* HEADER */}
            <div className="absolute top-0 left-0 w-full z-20 p-4 md:p-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/dashboard" className="p-3 bg-fdvp-text/5 hover:bg-fdvp-text/10 backdrop-blur-md rounded-xl transition-all border border-fdvp-text/10 text-fdvp-text hover:text-fdvp-text-light shadow-lg">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex items-center gap-2 bg-fdvp-text/5 backdrop-blur-md px-5 py-2.5 rounded-full border border-fdvp-text/10 shadow-lg">
                        <ScanLine size={16} className="text-fdvp-primary animate-pulse" />
                        <span className="text-sm font-bold tracking-wider uppercase text-fdvp-text-light">QR Scanner</span>
                    </div>
                    <div className="w-[52px]"></div> {/* Spacer for center alignment */}
                </div>
            </div>

            {/* AREA KAMERA / HASIL */}
            <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">

                {/* 1. TAMPILAN KAMERA (Jika belum ada hasil) */}
                {!scanResult && (
                    <div className="w-full h-full relative bg-fdvp-card">
                        <Scanner
                            onScan={(result) => result[0] && handleScan(result[0].rawValue)}
                            allowMultiple={true}
                            scanDelay={2000}
                            components={{ finder: false }}
                            styles={{
                                container: { width: "100%", height: "100%" },
                                video: { objectFit: "cover" }
                            }}
                        />

                        {/* Custom Overlay Finder */}
                        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center px-4">
                            <div className="w-full max-w-sm aspect-square relative">
                                {/* Scan frame */}
                                <div className="absolute inset-0 border-2 border-fdvp-text/20 rounded-3xl">
                                    {/* Corner accents */}
                                    <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-fdvp-primary rounded-tl-2xl"></div>
                                    <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-fdvp-primary rounded-tr-2xl"></div>
                                    <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-fdvp-primary rounded-bl-2xl"></div>
                                    <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-fdvp-primary rounded-br-2xl"></div>

                                    {/* Animated scan line */}
                                    <div className="absolute inset-0 overflow-hidden rounded-3xl">
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-fdvp-primary to-transparent animate-scan"></div>
                                    </div>

                                    {/* Pulse glow */}
                                    <div className="absolute inset-0 bg-fdvp-primary/5 animate-pulse rounded-3xl"></div>
                                </div>

                                {/* Instruction text */}
                                <p className="absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap text-white/80 text-sm font-medium bg-black/60 px-6 py-3 rounded-full backdrop-blur-md border border-white/10">
                                    Align QR code within frame
                                </p>
                            </div>
                        </div>

                        {/* MANUAL INPUT FOR TESTING */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
                            <div className="flex gap-2 items-center bg-fdvp-text/10 backdrop-blur-xl p-2 rounded-2xl border border-fdvp-text/10 shadow-2xl">
                                <input
                                    type="text"
                                    placeholder="Or enter ticket ID manually..."
                                    className="flex-1 bg-transparent text-white px-4 py-3 outline-none text-sm placeholder:text-white/40"
                                    value={manualId}
                                    onChange={(e) => setManualId(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && manualId && handleScan(manualId)}
                                />
                                <button
                                    onClick={() => manualId && handleScan(manualId)}
                                    disabled={!manualId}
                                    className="bg-fdvp-primary text-fdvp-bg p-3 rounded-xl hover:bg-fdvp-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                >
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Loading overlay */}
                        {loading && (
                            <div className="absolute inset-0 bg-fdvp-bg/95 backdrop-blur-md flex flex-col items-center justify-center z-30 animate-in fade-in duration-300">
                                <div className="relative">
                                    <Loader2 className="animate-spin text-fdvp-primary" size={56} />
                                    <div className="absolute inset-0 animate-ping">
                                        <Loader2 className="text-fdvp-primary/30" size={56} />
                                    </div>
                                </div>
                                <p className="font-bold text-xl tracking-wider uppercase text-fdvp-text-light mt-6">Verifying Ticket...</p>
                                <p className="text-sm text-fdvp-text/60 mt-2">Please wait</p>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. MODAL HASIL (SUCCESS / FAIL) - FDVP THEME */}
                {scanResult && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 md:p-8 bg-fdvp-bg/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-full max-w-lg">
                            {/* SUCCESS MODAL */}
                            {scanResult.valid ? (
                                <div className="bg-fdvp-text/5 backdrop-blur-md rounded-3xl border border-green-500/20 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                                    {/* Success Header */}
                                    <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-b border-green-500/20 p-8 text-center relative overflow-hidden">
                                        {/* Background decoration */}
                                        <div className="absolute inset-0 opacity-10">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                        </div>

                                        {/* Icon */}
                                        <div className="relative inline-flex items-center justify-center w-24 h-24 mx-auto mb-6">
                                            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                                            <div className="relative bg-green-500/20 backdrop-blur-md rounded-full p-5 border border-green-500/30">
                                                <CheckCircle2 className="text-green-400" size={48} strokeWidth={2.5} />
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-green-400 mb-2">
                                            Valid Ticket
                                        </h2>
                                        <p className="text-fdvp-text/70 text-sm font-medium">
                                            {scanResult.message || "Access granted successfully"}
                                        </p>
                                    </div>

                                    {/* User Details */}
                                    {scanResult.user && (
                                        <div className="p-8 space-y-6">
                                            <div className="bg-fdvp-text/5 rounded-2xl p-6 border border-fdvp-text/10">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center border-2 border-green-500/20">
                                                        <User className="text-green-400" size={28} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] uppercase font-bold tracking-widest text-fdvp-text/40 mb-1">Participant</p>
                                                        <h3 className="text-2xl font-bold text-fdvp-text-light truncate">{scanResult.user.displayName}</h3>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-fdvp-bg/50 rounded-xl p-4 border border-fdvp-text/5">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Briefcase size={14} className="text-fdvp-primary" />
                                                            <p className="text-[10px] uppercase font-bold tracking-widest text-fdvp-text/40">Position</p>
                                                        </div>
                                                        <p className="text-sm font-medium text-fdvp-text-light">{scanResult.user.job || "Not specified"}</p>
                                                    </div>
                                                    <div className="bg-fdvp-bg/50 rounded-xl p-4 border border-fdvp-text/5">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Ticket size={14} className="text-fdvp-primary" />
                                                            <p className="text-[10px] uppercase font-bold tracking-widest text-fdvp-text/40">Ticket ID</p>
                                                        </div>
                                                        <p className="text-sm font-mono text-fdvp-text-light">···{scanResult.user.id?.slice(-4) || "****"}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Timestamp */}
                                            <div className="flex items-center justify-center gap-2 text-xs text-fdvp-text/50">
                                                <Clock size={12} />
                                                <span>Scanned at {new Date().toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    <div className="p-6 pt-0">
                                        <button
                                            onClick={handleReset}
                                            className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/30 hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <RefreshCw size={20} />
                                            Scan Next Ticket
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* FAIL MODAL */
                                <div className="bg-fdvp-text/5 backdrop-blur-md rounded-3xl border border-red-500/20 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                                    {/* Error Header */}
                                    <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border-b border-red-500/20 p-8 text-center relative overflow-hidden">
                                        {/* Background decoration */}
                                        <div className="absolute inset-0 opacity-10">
                                            <div className="absolute top-0 left-0 w-64 h-64 bg-red-500 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
                                        </div>

                                        {/* Icon */}
                                        <div className="relative inline-flex items-center justify-center w-24 h-24 mx-auto mb-6">
                                            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
                                            <div className="relative bg-red-500/20 backdrop-blur-md rounded-full p-5 border border-red-500/30">
                                                <XCircle className="text-red-400" size={48} strokeWidth={2.5} />
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-red-400 mb-2">
                                            Invalid Ticket
                                        </h2>
                                        <p className="text-fdvp-text/70 text-sm font-medium">
                                            {scanResult.message || "This ticket is not valid"}
                                        </p>
                                    </div>

                                    {/* Error Details */}
                                    <div className="p-8 space-y-6">
                                        <div className="bg-red-500/5 rounded-2xl p-6 border border-red-500/10">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                                    <XCircle className="text-red-400" size={24} />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-fdvp-text-light mb-2">Possible Reasons:</h3>
                                                    <ul className="space-y-2 text-sm text-fdvp-text/70">
                                                        <li className="flex items-start gap-2">
                                                            <span className="text-red-400 mt-0.5">•</span>
                                                            <span>Ticket has already been used</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <span className="text-red-400 mt-0.5">•</span>
                                                            <span>Invalid or expired ticket ID</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <span className="text-red-400 mt-0.5">•</span>
                                                            <span>Ticket not found in system</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timestamp */}
                                        <div className="flex items-center justify-center gap-2 text-xs text-fdvp-text/50">
                                            <Clock size={12} />
                                            <span>Attempted at {new Date().toLocaleTimeString()}</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="p-6 pt-0">
                                        <button
                                            onClick={handleReset}
                                            className="w-full bg-fdvp-text/10 hover:bg-fdvp-text/20 text-fdvp-text-light px-6 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all border border-fdvp-text/10 hover:border-fdvp-text/20 hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <RefreshCw size={20} />
                                            Try Another Ticket
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* Custom CSS for scan animation */}
            <style jsx>{`
                @keyframes scan {
                    0%, 100% {
                        transform: translateY(0);
                        opacity: 0;
                    }
                    50% {
                        opacity: 1;
                    }
                }
                .animate-scan {
                    animation: scan 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}