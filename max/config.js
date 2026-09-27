/* Vul je EIGEN Firebase-webconfiguratie in. Dit is geen geheim; beveiliging gebeurt in Firestore-rules. */
globalThis.MAX_CONFIG = {
 firebase: null, /* {apiKey:"", authDomain:"", projectId:"", appId:"", messagingSenderId:""} */
 vapidKey: "", /* optioneel voor push */
 cloudFunctionRegion: "europe-west1"
};
