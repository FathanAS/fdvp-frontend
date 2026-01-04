self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        // Fallback for real push if implemented later
    }
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
