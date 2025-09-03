// js/auth.js
// Handles all user authentication logic (login, logout, state monitoring).
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { auth } from './firebase.js';
import { uiElements } from './ui/elements.js';
import { showApp, showLogin, setUserRoleUI } from './ui/actions.js';
import { listenForContainers, stopListeningForContainers } from './firestore.js';
import { cacheUserData, getUserRole } from './users.js';

export function monitorAuthState() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await cacheUserData(user);
            const role = getUserRole(user.uid);
            setUserRoleUI(role, user.email);
            showApp();
            listenForContainers();
        } else {
            setUserRoleUI(null, null);
            showLogin();
            stopListeningForContainers();
        }
    });
}

export async function handleLogin(e) {
    e.preventDefault();
    const email = uiElements.loginForm.email.value;
    const password = uiElements.loginForm.password.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        const loginError = document.getElementById('loginError');
        if(loginError) loginError.style.display = 'none';
    } catch (error) {
        console.error("Login failed:", error.message);
        const loginError = document.getElementById('loginError');
        if(loginError) {
            loginError.textContent = 'Invalid email or password. Please try again.';
            loginError.style.display = 'block';
        }
    }
}

export async function handleLogout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout failed:", error.message);
    }
}

