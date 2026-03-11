importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBkIMQ83ZC7BL5vIQHg-FaDCm8YEulgy1E",
  authDomain: "tutor-note-6e8b1.firebaseapp.com",
  databaseURL: "https://tutor-note-6e8b1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tutor-note-6e8b1",
  storageBucket: "tutor-note-6e8b1.firebasestorage.app",
  messagingSenderId: "120081834327",
  appId: "1:120081834327:web:82240754be152520265e12"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title || 'Thông báo từ Tutor Note';
  const notificationOptions = {
    body: payload.notification.body || 'Bạn có một thông báo mới',
    icon: '/tutor_logoss.png', // Assuming we have some icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
