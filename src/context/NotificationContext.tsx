
"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import iziToast from "izitoast";

interface NotificationContextType {
    notify: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'chat', image?: string) => void;
    muted: boolean;
    setMuted: (val: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType>({ notify: () => { }, muted: false, setMuted: () => { } });

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const socketRef = useRef<Socket | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [muted, setMuted] = useState(false);

    // Initialize Audio & Request Notification Permission & Load Settings
    useEffect(() => {
        // Init Audio
        audioRef.current = new Audio("/sounds/notification.mp3");

        // Load Mute Setting
        const savedMute = localStorage.getItem("notification_muted");
        if (savedMute) {
            setMuted(savedMute === 'true');
        }

        // Request Permission untuk System Notification (Desktop)
        if ("Notification" in window) {
            Notification.requestPermission().then(permission => {
                console.log("Notification permission:", permission);
            });
        }
    }, []);

    const mutedRef = useRef(muted);

    // Sync muted state to ref
    useEffect(() => {
        mutedRef.current = muted;
        localStorage.setItem("notification_muted", String(muted));
    }, [muted]);

    // Initialize Audio & Request Notification Permission
    useEffect(() => {
        // Init Audio
        audioRef.current = new Audio("/sounds/notification.mp3");

        // Request Permission untuk System Notification (Desktop/Mobile)
        if ("Notification" in window) {
            if (Notification.permission === "default") {
                Notification.requestPermission().then(permission => {
                    console.log("Notification permission request result:", permission);
                });
            }
        }
    }, []);

    const notify = (title: string, message: string, type: 'success' | 'error' | 'info' | 'chat' = 'info', image?: string) => {
        if (mutedRef.current) return; // Silent mode using Ref

        // 1. Play Sound (Optional)
        if (audioRef.current && (type === 'chat' || type === 'success')) {
            audioRef.current.play().catch(e => console.log("Audio play failed:", e));
        }

        // 2. IziToast Configuration
        const commonOptions = {
            title: title,
            message: message,
            position: 'topRight' as const,
            theme: 'dark' as const,
            backgroundColor: '#161616',
            titleColor: '#ffffff',
            messageColor: '#cccccc',
            progressBarColor: '#14FFEC',
            layout: 2,
            maxWidth: 400,
            overlay: false,
            timeout: 5000,
            transitionIn: 'bounceInLeft' as const,
            transitionOut: 'fadeOutRight' as const,
            displayMode: 2 as const,
            zindex: 999999,
        };

        switch (type) {
            case 'success':
                iziToast.success({ ...commonOptions, titleColor: '#4ade80', iconColor: '#4ade80', progressBarColor: '#4ade80' });
                break;
            case 'error':
                iziToast.error({ ...commonOptions, titleColor: '#f87171', iconColor: '#f87171', progressBarColor: '#f87171' });
                break;
            case 'chat':
                iziToast.show({
                    ...commonOptions,
                    image: image || undefined,
                    imageWidth: 40,
                    titleColor: '#14FFEC',
                    progressBarColor: '#14FFEC',
                    icon: !image ? 'ico-message' : undefined,
                });
                break;
            default:
                iziToast.info({ ...commonOptions, titleColor: '#60a5fa', iconColor: '#60a5fa', progressBarColor: '#60a5fa' });
                break;
        }
    };

    useEffect(() => {
        if (!user) return;

        // INIT SOCKET GLOBAL
        const socket = io(process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:3001", {
            transports: ["websocket"],
            query: { userId: user.uid }
        });
        socketRef.current = socket;

        // Helper untuk membuat icon bulat
        const getCircularIcon = (url: string): Promise<string> => {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = url;
                img.onload = () => {
                    try {
                        const canvas = document.createElement("canvas");
                        const w = 192;
                        const h = 192;
                        canvas.width = w;
                        canvas.height = h;
                        const ctx = canvas.getContext("2d");
                        if (!ctx) return resolve(url);

                        ctx.beginPath();
                        ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2, true);
                        ctx.closePath();
                        ctx.clip();
                        ctx.drawImage(img, 0, 0, w, h);
                        resolve(canvas.toDataURL());
                    } catch (e) {
                        resolve(url);
                    }
                };
                img.onerror = () => resolve("/favicon.ico");
            });
        };

        // LISTENER NOTIFIKASI
        socket.on("receiveNotification", async (data: { senderName: string, text: string, senderPhoto?: string, roomId: string }) => {
            console.log("🔔 CLIENT RECEIVED NOTIF:", data);

            // Cek Ref, bukan state 'muted' yang stale
            if (mutedRef.current) return;

            // 1. Tampilkan In-App Toast
            // Kita panggil notify manual di sini atau pakai logic iziToast langsung
            // Karena `notify` function di luar useEffect ini bisa stale jika dependensi tidak diupdate.
            // Agar aman, kita copy logic play sound & iziToast di sini atau fix notify dependency.
            // Cara termudah: panggil notify, tapi pastikan notify tidak bergantung state yang sering berubah (selain muted yang sudah di-ref).

            // Play sound manual here to be safe
            if (audioRef.current) audioRef.current.play().catch(e => console.log("Audio play failed"));

            iziToast.show({
                title: data.senderName,
                message: data.text,
                position: 'topRight',
                theme: 'dark',
                backgroundColor: '#161616',
                titleColor: '#14FFEC',
                messageColor: '#cccccc',
                progressBarColor: '#14FFEC',
                image: data.senderPhoto,
                imageWidth: 40,
                layout: 2,
                timeout: 5000,
            });

            // 2. Tampilkan System / Desktop Notification
            if ("Notification" in window && Notification.permission === "granted") {
                // Jangan menunggu icon create, langsung tampilkan notif agar cepat
                // Icon processing bisa lambat
                let iconUrl = data.senderPhoto || "/favicon.ico";

                try {
                    // Try to send notification
                    const notif = new Notification(`New message from ${data.senderName}`, {
                        body: data.text,
                        icon: iconUrl,
                        tag: data.roomId,
                        silent: false // Biarkan sistem bunyi juga jika user mau
                    });

                    notif.onclick = () => {
                        window.focus();
                        // Redirect ke chat room jika perlu: window.location.href = `/chat?room=${data.roomId}`
                    };
                } catch (e) {
                    console.error("System notification failed:", e);
                }
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [user]); // Hapus 'muted' dari dependency array agar socket tidak reconnect saat mute ditoggle

    return (
        <NotificationContext.Provider value={{ notify, muted, setMuted }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);

