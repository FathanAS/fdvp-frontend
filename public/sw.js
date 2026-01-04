self.addEventListener('push', function (event) {
    // Event ini ditrigger jika backend mengirim Push API (WebPush), tapi kita pakai WebSocket.
    // Code ini placeholder agar browser mengenali file ini sebagai Valid Service Worker.
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    // Saat notifikasi diklik, buka/fokus ke window chat
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow('/chat');
        })
    );
});
