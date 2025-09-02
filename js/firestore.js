// js/firestore.js
// Contains all logic for interacting with the Firestore database.

import { doc, getDoc, collection, onSnapshot, getDocs, writeBatch, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { auth, db } from './firebase.js';
import { renderContainersTable, uiElements, openDetailsModal, populateDetailsModal, closeDetailsModal, closeNewContainerModal } from './ui.js';

let containersUnsubscribe = null;
let currentContainerId = null; // To keep track of which container is open in the details modal

// --- Firestore Read Functions ---
export function listenForContainers() {
    const containersRef = collection(db, 'containers');
    containersUnsubscribe = onSnapshot(containersRef, (snapshot) => {
        if (snapshot.empty) {
            renderContainersTable([], handleViewContainer);
            return;
        }
        const containers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderContainersTable(containers, handleViewContainer);
    }, (error) => {
        console.error("Error listening for containers:", error);
        renderContainersTable(null, handleViewContainer);
    });
}

export function stopListeningForContainers() {
    if (containersUnsubscribe) {
        containersUnsubscribe();
        containersUnsubscribe = null;
    }
}

async function handleViewContainer(containerId) {
    currentContainerId = containerId;
    try {
        const containerDocRef = doc(db, 'containers', containerId);
        const containerDocSnap = await getDoc(containerDocRef);

        if (!containerDocSnap.exists()) {
            console.error("Container not found!");
            return;
        }

        const eventsRef = collection(db, 'containers', containerId, 'events');
        const q = query(eventsRef, orderBy('timestamp', 'desc'));
        const eventsSnapshot = await getDocs(q);
        const events = eventsSnapshot.docs;

        populateDetailsModal(containerDocSnap, events);
        openDetailsModal();

    } catch (error) {
        console.error("Error fetching container details:", error);
    }
}


// --- Firestore Write Functions ---
export async function populateDropdowns(target = 'all') {
    if (target === 'all' || target === 'bookings') await populateSelectWithOptions('bookings', 'bookingNumber', 'bookingNumber');
    if (target === 'all' || target === 'trucks') await populateSelectWithOptions('trucks', 'truck', 'truckName');
    if (target === 'all' || target === 'chassis') await populateSelectWithOptions('chassis', 'chassis', 'chassisName');
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
            currentLocation: "Yard",
            lastUpdatedAt: serverTimestamp()
        });

        const eventRef = doc(collection(db, 'containers', containerNumber, 'events'));
        batch.set(eventRef, {
            status: "Collected from Pier",
            timestamp: serverTimestamp(),
            userId: currentUser.uid,
            details: { truckId, chassisId, newLocation: "Yard" }
        });

        await batch.commit();
        closeNewContainerModal();

    } catch (error) {
        console.error("Error saving new container:", error);
        uiElements.formError.textContent = 'Failed to save container. Please try again.';
        uiElements.formError.style.display = 'block';
    }
}

export async function handleUpdateStatusSubmit(e) {
    e.preventDefault();
    if (!currentContainerId) return;

    const form = e.target;
    const action = form.dataset.action;
    const currentUser = auth.currentUser;
    if (!currentUser) {
        console.error("User not logged in");
        return;
    }

    let newStatus = '';
    let newLocation = '';
    let details = {};

    // Determine the update based on the form's action
    switch (action) {
        case 'placeInTilter':
            newLocation = form.tilterLocation.value;
            newStatus = 'Placed in Tilter';
            details = { newLocation };
            break;
        case 'loadingComplete':
            newLocation = form.tilterLocation.value;
            newStatus = 'Loading Complete';
            details = { newLocation };
            break;
        case 'weighContainer':
            newStatus = '⚖️ Needs Weighing';
            newLocation = 'Yard'; // Back in the yard after weighing
            details = {
                newLocation,
                weighAmount: form.weighAmount.value,
                truckId: form.truck.value,
                chassisId: form.chassis.value,
            };
            break;
         case 'assignNextAction':
            newStatus = form.nextAction.value;
            // Location depends on the action
            if (newStatus === '👨🏻‍🏭') newLocation = 'Workshop';
            else if (newStatus === '🏗') newLocation = 'IH Mathers';
            else if (newStatus === '👍🏻') newLocation = 'Yard - Ready';
            else newLocation = 'Yard'; // Default for Squish, Tire repairs
            details = { newLocation };
            break;
        case 'returnToPier':
            newStatus = 'Returned to Pier';
            newLocation = 'Pier';
            details = { newLocation };
            break;
        case 'reactivate':
            newStatus = '🤛🏻💨'; // Needs Squishing
            newLocation = 'Yard';
            details = { newLocation, reactivatedBy: currentUser.uid };
            break;
        default:
            console.error('Unknown update action:', action);
            return;
    }

    try {
        const batch = writeBatch(db);
        const containerRef = doc(db, 'containers', currentContainerId);
        batch.update(containerRef, {
            currentStatus: newStatus,
            currentLocation: newLocation,
            lastUpdatedAt: serverTimestamp()
        });
        
        const eventRef = doc(collection(db, 'containers', currentContainerId, 'events'));
        batch.set(eventRef, {
            status: newStatus,
            timestamp: serverTimestamp(),
            userId: currentUser.uid,
            details: details
        });

        await batch.commit();
        closeDetailsModal();

    } catch (error) {
        console.error("Error updating container status:", error);
    }
}

