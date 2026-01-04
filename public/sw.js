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

// 3. BACKGROUND MESSAGE HANDLER (Data-Only Payload)
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const { title, body, icon, click_action } = payload.data || {};

    // Custom Notification Options
    const notificationTitle = title || 'New Message';
    const notificationOptions = {
        body: body || 'You have a new message.',
        icon: icon || '/icons/icon-192x192.png',
        data: {
            url: click_action || '/chat'
        },
        // Interaction settings
        requireInteraction: true,
        actions: [
            { action: 'open', title: 'Open Chat' }
        ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 4. NOTIFICATION CLICK HANDLER (Focus Tab)
self.addEventListener('notificationclick', function (event) {
    console.log('[Service Worker] Notification click Received.', event.notification.data);

    event.notification.close();

    // URL to open
    const urlToOpen = new URL(event.notification.data.url || '/chat', self.location.origin).href;

    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then((windowClients) => {
        // Check if there is already a window/tab open with the target URL
        for (let i = 0; i < windowClients.length; i++) {
            const client = windowClients[i];
            // If URL matches or it's the chat page, focus it
            if (client.url === urlToOpen && 'focus' in client) {
                return client.focus();
            }
        }
        // If not, open a new window
        if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
        }
    });

    event.waitUntil(promiseChain);
});

// Listener "message" opsional untuk komunikasi Client -> SW
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
