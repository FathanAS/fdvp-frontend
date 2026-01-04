"use client";
import { useState, FormEvent } from "react";
// import { sendPasswordResetEmail } from "firebase/auth";
// import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader2, ArrowLeft, Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleReset = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);
        setLoading(true);

        try {
            // Panggil Backend Custom API (SMTP Desain Baru)
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to send reset email");
            }

            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-fdvp-bg font-sans selection:bg-fdvp-primary/30">

            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[url('/images/hero-bg.jpg')] bg-cover bg-center blur-sm opacity-50 scale-105"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-fdvp-bg/80 via-fdvp-bg/50 to-fdvp-bg"></div>
            </div>

            <div className="relative z-10 w-full max-w-md p-8 md:p-10 mx-4">
                <div className="bg-fdvp-card/60 backdrop-blur-2xl border border-fdvp-text/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-fdvp-light tracking-tight mb-2">
                            Forgot <span className="text-fdvp-primary">Password?</span>
                        </h1>
                        <p className="text-fdvp-text/80 text-sm">Enter your email and we'll send you a reset link.</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3 text-sm mb-8">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    {success ? (
                        <div className="text-center animate-in fade-in zoom-in py-2">
                            <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_-10px_rgba(74,222,128,0.3)]">
                                <Mail size={36} className="text-green-400" />
                                <div className="absolute ml-8 mt-8 bg-fdvp-card rounded-full border border-fdvp-bg">
                                    <CheckCircle size={20} className="text-green-400 bg-fdvp-bg rounded-full" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-fdvp-light mb-3">Email Sent!</h2>
                            <p className="text-fdvp-text/80 text-sm mb-8 leading-relaxed max-w-[80%] mx-auto">
                                We have sent a password reset link to <br />
                                <span className="font-bold text-fdvp-primary">{email}</span>
                            </p>

                            <div className="space-y-4">
                                <Link href="https://mail.google.com" target="_blank" className="block w-full bg-fdvp-text/5 border border-fdvp-text/10 text-fdvp-light font-bold py-3 rounded-xl hover:bg-fdvp-text/10 transition-all flex items-center justify-center gap-2">
                                    <Mail size={18} /> Open Email App
                                </Link>
                                <Link href="/login" className="block w-full bg-fdvp-primary text-fdvp-bg font-bold py-3 rounded-xl hover:bg-fdvp-text-light transition-all shadow-lg hover:shadow-fdvp-primary/20 hover:scale-[1.02]">
                                    Back to Login
                                </Link>
                            </div>

                            <button
                                onClick={() => setSuccess(false)}
                                className="mt-8 text-xs text-fdvp-text/30 hover:text-fdvp-text transition-colors"
                            >
                                Wrong email? Try again
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-fdvp-text/60 uppercase tracking-widest pl-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="member@fdvp.com"
                                    className="w-full bg-fdvp-text/5 border border-fdvp-text/10 rounded-xl px-4 py-3.5 text-fdvp-light placeholder:text-fdvp-text/30 focus:outline-none focus:border-fdvp-primary/50 focus:bg-fdvp-text/10 transition-all"
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-fdvp-primary hover:bg-fdvp-accent text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-fdvp-primary/20 hover:scale-[1.02]"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : "Send Reset Link"}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 text-center">
                        <Link href="/login" className="text-fdvp-text/60 hover:text-fdvp-primary text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                            <ArrowLeft size={16} /> Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
