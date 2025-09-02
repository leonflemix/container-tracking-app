// js/firebase.js
// This file initializes Firebase and exports the auth and db services.

// Replace this with your own Firebase configuration object.
const firebaseConfig = {
            apiKey: "AIzaSyACbLKXVKBb6DJhCvZVQPq_36LYXQnowtI",
            authDomain: "container-tracker-app-9e667.firebaseapp.com",
            projectId: "container-tracker-app-9e667",
            storageBucket: "container-tracker-app-9e667.firebasestorage.app",
            messagingSenderId: "54664527552",
            appId: "1:54664527552:web:e249a4b6df1afab555f725"
        };

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and firestore services
export const auth = getAuth(app);
export const db = getFirestore(app);

