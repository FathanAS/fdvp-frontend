importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDxK3LEBQItUXyU_f0ar30miPhehNs8RNA",
    authDomain: "fdvp-db.firebaseapp.com",
    projectId: "fdvp-db",
    storageBucket: "fdvp-db.firebasestorage.app",
    messagingSenderId: "1085243279530",
    appId: "1:1085243279530:web:f6a32fe0abff4dae37e8d3",
    measurementId: "G-NF8P5HKCCJ"
});

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

const messaging = firebase.messaging();

// Handle background messages via FCM
messaging.onBackgroundMessage((payload) => {
    console.log('[sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon || '/icon-192.png',
        badge: '/icon-192.png',
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    // Handle Action Click (e.g. "Reply" or "Open")
    // For now, all actions lead to opening the chat

    // Ambil URL target dari data notifikasi (jika ada), default ke /chat
    const targetUrl = event.notification.data?.url || '/chat';

    // Saat notifikasi diklik, buka/fokus ke window chat
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // Cek apakah ada tab yang sudah terbuka di URL yang sama
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                // Cek URL (sederhana) - jika chat sudah terbuka, fokuskan
                if (client.url.includes('chat') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Jika tidak ada yang pas, buka window baru
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

// Listener "message" opsional untuk komunikasi Client -> SW
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
