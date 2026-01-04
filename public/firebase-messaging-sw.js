importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// TODO: USER MUST REPLACE THESE VALUES WITH "src/lib/firebase.ts" VALUES
// or "Project Settings" > "General" from Firebase Console.
// Environment variables do not work here in Service Worker directly.
firebase.initializeApp({
    apiKey: "REPLACE_WITH_YOUR_API_KEY",
    authDomain: "REPLACE_WITH_YOUR_AUTH_DOMAIN",
    projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
    storageBucket: "REPLACE_WITH_YOUR_STORAGE_BUCKET",
    messagingSenderId: "REPLACE_WITH_YOUR_MESSAGING_SENDER_ID",
    appId: "REPLACE_WITH_YOUR_APP_ID",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon || '/icon-192.png',
        badge: '/icon-192.png',
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
