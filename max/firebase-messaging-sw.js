/* Messaging registration stays on /max/push/ so it does not replace the website's offline service worker. */
importScripts('./config.js');
if (self.MAX_CONFIG?.firebase?.messagingSenderId) {
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
  firebase.initializeApp(self.MAX_CONFIG.firebase);
  firebase.messaging();
}
