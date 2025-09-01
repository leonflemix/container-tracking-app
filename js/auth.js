// js/auth.js
// Handles all user authentication logic.

import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { auth, db } from './firebase.js';
import { showApp, showLogin, setUserRoleUI } from './ui.js';
import { listenForContainers, stopListeningForContainers } from './firestore.js';

// --- Functions ---
export function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('loginError');
    loginError.style.display = 'none';
    
    signInWithEmailAndPassword(auth, email, password)
        .catch(error => {
            console.error("Login Error:", error);
            loginError.textContent = "Invalid email or password.";
            loginError.style.display = 'block';
        });
}

export function handleLogout() {
    signOut(auth).catch(error => console.error("Logout Error:", error));
}

export function monitorAuthState() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            let role = 'viewer'; // Default role
            if (userDocSnap.exists()) {
               role = userDocSnap.data().role;
            }
            showApp();
            setUserRoleUI(role, user.email);
            listenForContainers();
        } else {
            // User is signed out
            showLogin();
            stopListeningForContainers();
        }
    });
}

