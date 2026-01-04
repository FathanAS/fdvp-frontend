
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

    // Save Mute Setting
    useEffect(() => {
        localStorage.setItem("notification_muted", String(muted));
    }, [muted]);

    const notify = (title: string, message: string, type: 'success' | 'error' | 'info' | 'chat' = 'info', image?: string) => {
        if (muted) return; // Silent mode

        // 1. Play Sound (Optional)
        if (audioRef.current && (type === 'chat' || type === 'success')) {
            audioRef.current.play().catch(e => console.log("Audio play failed"));
        }

        // 2. IziToast Configuration
        const commonOptions = {
            title: title,
            message: message,
            position: 'topRight' as const,
            theme: 'dark' as const,
            backgroundColor: '#161616', // Darker background
            titleColor: '#ffffff',
            messageColor: '#cccccc',
            progressBarColor: '#14FFEC', // Default accent
            layout: 2, // Layout with icon/image on left
            maxWidth: 400,
            overlay: false,
            timeout: 5000,
            transitionIn: 'bounceInLeft' as const,
            transitionOut: 'fadeOutRight' as const,
            displayMode: 2 as const,
            zindex: 999999, // Ensure above Navbar (z-5000)
        };

        switch (type) {
            case 'success':
                iziToast.success({
                    ...commonOptions,
                    titleColor: '#4ade80', // Green
                    iconColor: '#4ade80',
                    progressBarColor: '#4ade80',
                });
                break;
            case 'error':
                iziToast.error({
                    ...commonOptions,
                    titleColor: '#f87171', // Red
                    iconColor: '#f87171',
                    progressBarColor: '#f87171',
                });
                break;
            case 'chat':
                iziToast.show({
                    ...commonOptions,
                    image: image || undefined,
                    imageWidth: 40,
                    titleColor: '#14FFEC',
                    progressBarColor: '#14FFEC',
                    icon: !image ? 'ico-message' : undefined, // Fallback icon if no image
                    // Custom template could be used but built-in image support is fine
                });
                break;
            default: // info
                iziToast.info({
                    ...commonOptions,
                    titleColor: '#60a5fa', // Blue
                    iconColor: '#60a5fa',
                    progressBarColor: '#60a5fa',
                });
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

        // Helper untuk membuat icon bulat (Canvas Processing) for Desktop Notifications
        const getCircularIcon = (url: string): Promise<string> => {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = url;
                img.onload = () => {
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
                };
                img.onerror = () => {
                    resolve("/favicon.ico");
                };
            });
        };

        // LISTENER NOTIFIKASI
        socket.on("receiveNotification", async (data: { senderName: string, text: string, senderPhoto?: string, roomId: string }) => {
            console.log("🔔 CLIENT RECEIVED NOTIF:", data); // Debug Log
            if (muted) return;

            // 1. Tampilkan In-App Toast via generic notify
            notify(data.senderName, data.text, 'chat', data.senderPhoto);

            // 2. Tampilkan System / Desktop Notification (Khusus Chat)
            if ("Notification" in window && Notification.permission === "granted") {
                let iconUrl = "/favicon.ico";
                if (data.senderPhoto) {
                    try {
                        iconUrl = await getCircularIcon(data.senderPhoto);
                    } catch (e) {
                        iconUrl = data.senderPhoto;
                    }
                }

                new Notification(`New message from ${data.senderName}`, {
                    body: data.text,
                    icon: iconUrl,
                    tag: data.roomId
                });
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [user, muted]); // Added muted to dependency if we want to react strictly, but notify checks ref or current state. 
    // Wait, 'muted' in useEffect dependency might cause reconnects if not careful. 
    // socket does NOT need to reconnect just because mute changed. 
    // The 'muted' state inside the event listener closure will be stale if I don't use a ref or include it.
    // Reconnecting socket on mute toggle is overkill but ensures 'muted' variable is fresh in the closure.
    // Better approach: Use a ref for 'muted' inside the effect if avoiding reconnects, OR just let it reconnect (cheap enough).
    // Given the complexity, letting it reconnect is safest for consistency, OR relying on `notify` (which is outside) is tricky because notify is defined outside.
    // Actually `notify` captures `muted` from the render scope.
    // If I call `notify` inside `socket.on`, it uses the `notify` from when the effect ran.
    // So yes, I need to include `muted` in the dependency array or `notify` in it.
    // Since `notify` depends on `muted`, it changes on every render? No, `notify` is function declaration inside component... it is recreated every render.
    // So `useEffect` will re-run every render if I add `notify`.
    // I should wrap `notify` in `useCallback` or use a Ref for `muted`.
    // For simplicity given the time: I will add `muted` to dependency. Reconnecting socket is acceptable for a settings toggle.

    return (
        <NotificationContext.Provider value={{ notify, muted, setMuted }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);

