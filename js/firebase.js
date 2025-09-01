// js/firebase.js
// This file's only job is to initialize Firebase and export the services.

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// TODO: Add your own Firebase configuration from your Firebase project settings
const firebaseConfig = {
            apiKey: "AIzaSyACbLKXVKBb6DJhCvZVQPq_36LYXQnowtI",
            authDomain: "container-tracker-app-9e667.firebaseapp.com",
            projectId: "container-tracker-app-9e667",
            storageBucket: "container-tracker-app-9e667.firebasestorage.app",
            messagingSenderId: "54664527552",
            appId: "1:54664527552:web:e249a4b6df1afab555f725"
        };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export the initialized services
export { auth, db };

