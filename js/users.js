// js/users.js
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { db } from './firebase.js';

const userCache = new Map();

export async function fetchAllUsers() {
    if (userCache.size > 0) return; // Don't re-fetch if cache is populated
    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        querySnapshot.forEach(doc => {
            // Assumes user doc has a 'name' field, otherwise defaults to 'email'
            userCache.set(doc.id, doc.data().name || doc.data().email || 'Unknown User');
        });
    } catch (error) {
        console.error("Error fetching and caching users:", error);
    }
}

export function getUserName(uid) {
    return userCache.get(uid) || 'Unknown User';
}
