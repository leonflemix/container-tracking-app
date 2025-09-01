// js/firestore.js
// Contains all logic for interacting with the Firestore database.

import { doc, getDoc, collection, onSnapshot, getDocs, writeBatch, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { auth, db } from './firebase.js';
import { renderContainersTable, uiElements } from './ui.js';

let containersUnsubscribe = null;

// --- Firestore Functions ---
export function listenForContainers() {
    const containersRef = collection(db, 'containers');
    containersUnsubscribe = onSnapshot(containersRef, (snapshot) => {
        if (snapshot.empty) {
            renderContainersTable([]);
            return;
        }
        const containers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderContainersTable(containers);
    }, (error) => {
        console.error("Error listening for containers:", error);
        renderContainersTable(null); // Indicate an error state
    });
}

export function stopListeningForContainers() {
    if (containersUnsubscribe) {
        containersUnsubscribe();
        containersUnsubscribe = null;
    }
}

export async function populateDropdowns() {
    await populateSelectWithOptions('bookings', 'bookingNumber', 'bookingNumber');
    await populateSelectWithOptions('trucks', 'truck', 'truckName');
    await populateSelectWithOptions('chassis', 'chassis', 'chassisName');
}

async function populateSelectWithOptions(collectionName, selectId, textField) {
    const selectElement = document.getElementById(selectId);
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        selectElement.innerHTML = `<option value="">-- Select ${selectId} --</option>`;
        querySnapshot.forEach(doc => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = data[textField];
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error(`Error populating ${collectionName}:`, error);
        selectElement.innerHTML = `<option value="">Error loading data</option>`;
    }
}

export async function handleNewContainerSubmit(e) {
    e.preventDefault();
    const containerNumber = uiElements.newContainerForm.containerNumber.value.trim().toUpperCase();
    const bookingId = uiElements.newContainerForm.bookingNumber.value;
    const truckId = uiElements.newContainerForm.truck.value;
    const chassisId = uiElements.newContainerForm.chassis.value;

    if (!containerNumber || !bookingId || !truckId || !chassisId) {
        uiElements.formError.textContent = 'Please fill out all fields.';
        uiElements.formError.style.display = 'block';
        return;
    }
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
         uiElements.formError.textContent = 'You must be logged in to perform this action.';
         uiElements.formError.style.display = 'block';
         return;
    }

    try {
        const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
        const bookingNumberString = bookingDoc.exists() ? bookingDoc.data().bookingNumber : 'Unknown';

        const batch = writeBatch(db);
        
        const containerRef = doc(db, 'containers', containerNumber);
        batch.set(containerRef, {
            bookingNumber: bookingNumberString,
            currentStatus: "In Yard",
            currentLocation: "Yard - Section A",
            lastUpdatedAt: serverTimestamp()
        });

        const eventRef = doc(collection(db, 'containers', containerNumber, 'events'));
        batch.set(eventRef, {
            status: "Collected from Pier",
            timestamp: serverTimestamp(),
            userId: currentUser.uid,
            details: { truckId, chassisId }
        });

        await batch.commit();
        uiElements.newContainerModal.classList.add('hidden');

    } catch (error) {
        console.error("Error saving new container:", error);
        uiElements.formError.textContent = 'Failed to save container. Please try again.';
        uiElements.formError.style.display = 'block';
    }
}

