"use client";
import { useEffect, useState } from "react";
import { X, Copy, Check, Facebook, Twitter, Linkedin, Link2, MessageCircle } from "lucide-react";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
    title: string;
}

export default function ShareModal({ isOpen, onClose, url, title }: ShareModalProps) {
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error(err);
        }
    };

    if (!isOpen) return null;

    // Social Share Links
    const shareLinks = [
        {
            name: "WhatsApp",
            icon: <MessageCircle size={24} />,
            color: "bg-[#25D366]",
            href: `https://wa.me/?text=${encodeURIComponent(title + " " + url)}`
        },
        {
            name: "Twitter",
            icon: <Twitter size={24} />,
            color: "bg-[#1DA1F2]",
            href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
        },
        {
            name: "LinkedIn",
            icon: <Linkedin size={24} />,
            color: "bg-[#0A66C2]",
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
        },
        {
            name: "Facebook",
            icon: <Facebook size={24} />,
            color: "bg-[#1877F2]",
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        }
    ];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-md bg-fdvp-card border border-fdvp-text/10 rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-fdvp-text-light">Share Event</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-fdvp-text/5 rounded-full text-fdvp-text transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Social Icons */}
                <div className="flex gap-4 justify-center mb-8">
                    {shareLinks.map((platform) => (
                        <a
                            key={platform.name}
                            href={platform.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110 shadow-lg ${platform.color}`}
                            title={`Share on ${platform.name}`}
                        >
                            {platform.icon}
                        </a>
                    ))}
                </div>

                {/* Copy Link Input */}
                <div className="space-y-2">
                    <label className="text-xs text-fdvp-text uppercase font-bold tracking-widest pl-1">Page Link</label>
                    <div className="flex items-center gap-2 bg-fdvp-text/5 p-2 rounded-xl border border-fdvp-text/10 focus-within:border-fdvp-primary/50 transition-colors">
                        <div className="p-2 text-fdvp-text/50">
                            <Link2 size={18} />
                        </div>
                        <input
                            readOnly
                            value={url}
                            className="flex-1 bg-transparent border-none text-sm text-fdvp-text-light focus:outline-none truncate"
                        />
                        <button
                            onClick={handleCopy}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${copied
                                    ? "bg-green-500/10 text-green-500"
                                    : "bg-fdvp-primary text-white hover:bg-fdvp-accent"
                                }`}
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? "Copied!" : "Copy"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
