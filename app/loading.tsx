"use client";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Simulate progress animation
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) {
                    clearInterval(interval);
                    return 95;
                }
                return prev + Math.random() * 20;
            });
        }, 150);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-fdvp-bg">
            {/* Logo */}
            <div className="mb-8 animate-pulse">
                <img
                    src="/images/logo-fdvp-white.png"
                    alt="FDVP Logo"
                    className="w-32 h-auto opacity-80"
                />
            </div>

            {/* Spinner */}
            <Loader2 className="animate-spin text-fdvp-primary mb-6" size={48} />

            {/* Progress Bar Container */}
            <div className="w-64 md:w-80">
                <div className="h-1.5 bg-fdvp-text/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-fdvp-primary to-fdvp-accent rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
                <p className="text-center text-fdvp-text/50 text-sm mt-4 font-mono">
                    {Math.round(Math.min(progress, 100))}%
                </p>
            </div>

            {/* Loading Text */}
            <p className="text-fdvp-text/30 text-xs uppercase tracking-[0.3em] mt-6">
                Loading...
            </p>

            {/* Decorative Blobs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fdvp-primary/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-fdvp-accent/10 rounded-full blur-[120px] pointer-events-none" />
        </div>
    );
}
