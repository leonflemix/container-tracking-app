// js/users.js
// Manages a simple cache for user data to avoid repeated Firestore reads.
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { db } from './firebase.js';

const userCache = new Map();

export async function cacheUserData(user) {
    if (!user || !user.uid) return;
    if (userCache.has(user.uid)) return;

    try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            userCache.set(user.uid, {
                name: userData.name || user.email, // Fallback to email if name is not set
                email: user.email,
                role: userData.role || 'viewer'
            });
        } else {
            // If no user doc, cache with basic info from auth
            userCache.set(user.uid, {
                name: user.email,
                email: user.email,
                role: 'viewer' 
            });
        }
    } catch (error) {
        console.error("Error caching user data:", error);
    }
}

export function getUserName(uid) {
    if (userCache.has(uid)) {
        return userCache.get(uid).name;
    }
    return uid; // Fallback to UID if not in cache
}

export function getUserRole(uid) {
     if (userCache.has(uid)) {
        return userCache.get(uid).role;
    }
    return 'viewer'; // Default to viewer
}

