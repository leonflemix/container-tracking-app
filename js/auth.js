// js/auth.js
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { auth, db } from './firebase.js';
import { showApp, showLogin, setUserRoleUI } from './ui.js';
import { listenForContainers, stopListeningForContainers } from './firestore.js';
import { fetchAllUsers } from './users.js'; // Import the new user fetching function

export function monitorAuthState() {
    onAuthStateChanged(auth, async user => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            let userRole = 'viewer'; // Default role
            if (userDocSnap.exists()) {
                userRole = userDocSnap.data().role;
            }
            
            await fetchAllUsers(); // Cache all user data on successful login
            setUserRoleUI(userRole, user.email);
            
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
    const email = e.target.email.value;
    const password = e.target.password.value;
    const errorEl = document.getElementById('loginError');
    errorEl.style.display = 'none';

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        errorEl.textContent = "Invalid email or password.";
        errorEl.style.display = 'block';
        console.error("Login failed:", error.message);
    }
}

export async function handleLogout() {
    await signOut(auth);
}

