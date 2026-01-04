
"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import iziToast from "izitoast";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "@/lib/firebase";

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

    const processedRefs = useRef(new Set<string>());

    useEffect(() => {
        if (!user) return;

        // REGISTER SERVICE WORKER (Wajib untuk notifikasi Android/HyperOS saat background)
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => {
                    console.log('Service Worker registered:', reg);
                    // Ensure active immediatley
                    if (reg.installing) {
                        console.log('Service worker installing');
                    } else if (reg.waiting) {
                        console.log('Service worker installed');
                    } else if (reg.active) {
                        console.log('Service worker active');
                    }
                })
                .catch(err => console.log('Service Worker registration failed:', err));

            // Re-request permission if default
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }

        // ==========================================
        // FCM LOGIC (Firebase Cloud Messaging)
        // ==========================================
        const initFcm = async () => {
            try {
                const messaging = getMessaging(app);

                // 1. Request Permission
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {

                    // 2. Get Token
                    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
                    if (!vapidKey) {
                        console.warn("FCM VAPID Key is missing in .env");
                        return;
                    }

                    const currentToken = await getToken(messaging, {
                        vapidKey: vapidKey
                    });

                    if (currentToken) {
                        console.log("FCM Token:", currentToken);
                        // Save to Backend
                        const savedToken = localStorage.getItem("fcm_token");
                        if (savedToken !== currentToken) {
                            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/users/fcm-token`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: user.uid, token: currentToken })
                            });
                            localStorage.setItem("fcm_token", currentToken);
                            console.log("FCM Token saved to backend");
                        }
                    } else {
                        console.log('No registration token available. Request permission to generate one.');
                    }

                    // 3. Foreground Message Handler
                    onMessage(messaging, (payload) => {
                        console.log('FCM Foreground Message:', payload);
                        const { title, body, icon } = payload.notification || {};
                        notify(title || 'New Message', body || '', 'chat', icon);
                    });
                }
            } catch (error) {
                console.error("FCM Init Error:", error);
            }
        };

        initFcm();
        // ==========================================

        // INIT SOCKET GLOBAL
        const socket = io(process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:3001", {
            transports: ["websocket"],
            query: { userId: user.uid },
            reconnection: true,             // Auto reconnect
            reconnectionAttempts: Infinity, // Terus mencoba
        });
        socketRef.current = socket;

        // Helper for simple notification if SW fails
        const fallbackNotification = (data: any) => {
            if (Notification.permission === "granted") {
                new Notification(`New Message from ${data.senderName}`, {
                    body: data.text,
                    icon: data.senderPhoto || '/icon-192.png',
                    requireInteraction: true
                });
            }
        };

        // LISTENER NOTIFIKASI
        socket.on("receiveNotification", async (data: { senderName: string, text: string, senderPhoto?: string, roomId: string, senderId?: string }) => {
            console.log("🔔 CLIENT RECEIVED NOTIF:", data);

            // ... (rest of code) ...

            // DEDUPLICATION CHECK (Anti-Spam / Anti-Double)
            const notifKey = `${data.roomId}-${data.text}`;
            if (processedRefs.current.has(notifKey)) {
                console.log("Duplicate notification suppressed:", notifKey);
                return;
            }
            // Add to set and expire after 2 seconds
            processedRefs.current.add(notifKey);
            setTimeout(() => {
                processedRefs.current.delete(notifKey);
            }, 2000);

            if (mutedRef.current) return;

            // STRATEGI NOTIFIKASI HYBRID (Mencegah Double & Memastikan Tembus OS)

            // KONDISI 1: User sedang membuka tab aplikasi (Active/Visible)
            if (document.visibilityState === 'visible') {
                // Play Sound
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(e => console.log("Audio play failed"));
                }

                // Show In-App Toast ONLY
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
                    // onClick: () => window.location.href = `/chat` // Opsional: redirect
                });
            }
            // KONDISI 2: User sedang di tab lain atau Web di minimize (Background/Hidden)
            else {
                // Gunakan Service Worker Registration untuk menampilkan notifikasi System (Lebih kuat tembus OS Android)
                if (Notification.permission === 'granted' && 'serviceWorker' in navigator && navigator.serviceWorker.ready) {
                    navigator.serviceWorker.ready.then(reg => {
                        try {
                            reg.showNotification(`New Message from ${data.senderName}`, {
                                body: data.text,
                                icon: data.senderPhoto || '/icon-192.png',
                                badge: '/icon-192.png',
                                tag: 'chat-message', // Groups notifications
                                // @ts-ignore
                                renotify: true,
                                requireInteraction: true, // Keep until user interacts ("Tidak kaku/Tetap tampilkan")
                                vibrate: [200, 100, 200],
                                data: {
                                    url: '/chat',
                                    roomId: data.roomId,
                                    senderId: data.senderId
                                },
                                // @ts-ignore
                                actions: [
                                    { action: 'open_chat', title: 'Open Chat' }
                                ]
                            });
                        } catch (e) {
                            console.error("Error showing SW notification", e);
                            fallbackNotification(data);
                        }
                    }).catch(e => {
                        console.error("Service Worker ready promise rejected:", e);
                        fallbackNotification(data);
                    });
                } else {
                    fallbackNotification(data);
                }

                // Play Sound also in background if browser allows
                if (audioRef.current) audioRef.current.play().catch(() => { });
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    return (
        <NotificationContext.Provider value={{ notify, muted, setMuted }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);

