importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// TODO: USER MUST REPLACE THESE VALUES WITH "src/lib/firebase.ts" VALUES
// or "Project Settings" > "General" from Firebase Console.
// Environment variables do not work here in Service Worker directly.
firebase.initializeApp({
    apiKey: "AIzaSyAvqTvItXWYsEp7JY_61Ks-djHRiO32O18",
    authDomain: "fdvp-db.firebaseapp.com",
    projectId: "fdvp-db",
    storageBucket: "fdvp-db.firebasestorage.app",
    messagingSenderId: "1085243279530",
    appId: "1:1085243279530:web:f6a32fe0abff4dae37e8d3",
    measurementId: "G-NF8P5HKCCJ"
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
