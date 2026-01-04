"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [email, setEmail] = useState("");

    const router = useRouter();
    const searchParams = useSearchParams();
    const oobCode = searchParams.get("oobCode");

    useEffect(() => {
        if (!oobCode) {
            setError("Invalid or missing reset code.");
            setVerifying(false);
            return;
        }

        // Verify the code on load to show likely user email or detect invalid code early
        verifyPasswordResetCode(auth, oobCode)
            .then((email) => {
                setEmail(email);
                setVerifying(false);
            })
            .catch((err) => {
                console.error(err);
                setError("Invalid or expired reset link. Please request a new one.");
                setVerifying(false);
            });
    }, [oobCode]);

    const handleReset = async (e: FormEvent) => {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (!oobCode) return;

        setLoading(true);

        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to reset password.");
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-fdvp-bg">
                <Loader2 className="animate-spin text-fdvp-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-fdvp-bg font-sans selection:bg-fdvp-primary/30">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[url('/images/hero-bg.jpg')] bg-cover bg-center blur-sm opacity-50 scale-105"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-fdvp-bg/80 via-fdvp-bg/50 to-fdvp-bg"></div>
            </div>

            <div className="relative z-10 w-full max-w-md p-8 md:p-10 mx-4">
                <div className="bg-fdvp-card/60 backdrop-blur-2xl border border-fdvp-text/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-fdvp-light tracking-tight mb-2">
                            Reset <span className="text-fdvp-primary">Password</span>
                        </h1>
                        {!success && !error && (
                            <p className="text-fdvp-text/80 text-sm">Create a new password for <strong>{email}</strong></p>
                        )}
                    </div>

                    {error ? (
                        <div className="text-center">
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center justify-center gap-3 text-sm mb-6">
                                <AlertCircle size={18} /> {error}
                            </div>
                            <Link href="/forgot-password" className="block w-full bg-fdvp-primary text-fdvp-bg font-bold py-3 rounded-xl hover:bg-fdvp-text-light transition-all shadow-lg hover:shadow-fdvp-primary/20">
                                Request New Link
                            </Link>
                        </div>
                    ) : success ? (
                        <div className="text-center animate-in fade-in zoom-in py-2">
                            <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_-10px_rgba(74,222,128,0.3)]">
                                <CheckCircle size={36} className="text-green-400" />
                            </div>

                            <h2 className="text-2xl font-bold text-fdvp-light mb-3">Password Reset!</h2>
                            <p className="text-fdvp-text/80 text-sm mb-8">
                                Your password has been successfully updated. You can now login with your new password.
                            </p>

                            <Link href="/login" className="block w-full bg-fdvp-primary text-fdvp-bg font-bold py-3 rounded-xl hover:bg-fdvp-text-light transition-all shadow-lg hover:shadow-fdvp-primary/20 hover:scale-[1.02]">
                                Back to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-fdvp-text/60 uppercase tracking-widest pl-1">New Password</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-fdvp-text/40">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-fdvp-text/5 border border-fdvp-text/10 rounded-xl pl-11 pr-12 py-3.5 text-fdvp-light placeholder:text-fdvp-text/30 focus:outline-none focus:border-fdvp-primary/50 focus:bg-fdvp-text/10 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-fdvp-text/40 hover:text-fdvp-text transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-fdvp-text/60 uppercase tracking-widest pl-1">Confirm Password</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-fdvp-text/40">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-fdvp-text/5 border border-fdvp-text/10 rounded-xl pl-11 pr-12 py-3.5 text-fdvp-text-light placeholder:text-fdvp-text/30 focus:outline-none focus:border-fdvp-primary/50 focus:bg-fdvp-text/10 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-fdvp-primary hover:bg-fdvp-accent text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-fdvp-primary/20 hover:scale-[1.02]"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : "Reset Password"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
