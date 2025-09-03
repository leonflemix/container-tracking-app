// js/firestore.js
import { doc, getDoc, collection, onSnapshot, getDocs, writeBatch, serverTimestamp, query, orderBy, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { auth, db } from './firebase.js';
import { uiElements } from './ui/elements.js';
import { renderContainersTable, populateDetailsModal } from './ui/render.js';
import { openDetailsModal, closeDetailsModal, closeNewContainerModal } from './ui/actions.js';

let containersUnsubscribe = null;
let currentContainerId = null; 

export function listenForContainers() {
    const containersRef = collection(db, 'containers');
    const q = query(containersRef, orderBy('lastUpdatedAt', 'desc'));
    containersUnsubscribe = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            renderContainersTable([], handleViewContainer);
            return;
        }
        const containers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderContainersTable(containers, handleViewContainer);
    }, (error) => {
        console.error("Error listening for containers:", error);
        renderContainersTable([], handleViewContainer);
    });
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
            lastUpdatedAt: serverTimestamp(),
            collectedAt: serverTimestamp()
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

    const form = e.target.closest('form');
    const action = e.submitter?.dataset.action || form.dataset.action;

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    let newStatus = '';
    let newLocation = '';
    let details = {};

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
            const chassisDoc = await getDoc(doc(db, 'chassis', form.chassis.value));
            const chassisName = chassisDoc.exists() ? chassisDoc.data().chassisName : 'Unknown Chassis';
            newStatus = 'Post-Weighing';
            newLocation = `Chassis ${chassisName}`;
            details = {
                newLocation,
                weighAmount: form.weighAmount.value,
                sealNumber: form.sealNumber.value,
                truckId: form.truck.value,
                chassisId: form.chassis.value,
            };
            break;
         case 'assignNextAction':
            const selectedActions = Array.from(form.nextActions.selectedOptions).map(opt => opt.value);
            // If no issues are selected, this button does nothing, user should click "Mark as Ready"
            if (selectedActions.length === 0) {
                alert("Please select at least one action or click 'Mark as Ready for Pier'.");
                return;
            }
            newStatus = selectedActions.join(', ');
            const containerDoc = await getDoc(doc(db, 'containers', currentContainerId));
            newLocation = containerDoc.data().currentLocation; 
            details = { newLocation, assignedActions: selectedActions };
            break;
        case 'moveToMathers':
            newStatus = '🏗 At IH Mathers';
            newLocation = 'IH Mathers';
            details = { newLocation };
            break;
        case 'markAsReady':
            newStatus = '👍🏻 Ready for Pier';
            const currentContainer = await getDoc(doc(db, 'containers', currentContainerId));
            newLocation = currentContainer.data().currentLocation;
            details = { newLocation };
            break;
        case 'returnToPier':
            newStatus = 'Returned to Pier';
            newLocation = 'Pier';
            details = { newLocation };
            break;
        case 'reactivate':
            newStatus = '🤛🏻💨';
            newLocation = 'Yard';
            details = { newLocation, reactivatedBy: currentUser.uid };
            break;
        default: return;
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


export async function handleDeleteLastEvent(containerId, eventId, previousEventData) {
    if (document.body.dataset.userRole !== 'admin') {
        console.error("Permission denied: Only admins can delete events.");
        return;
    }
    
    try {
        const batch = writeBatch(db);
        const eventToDeleteRef = doc(db, 'containers', containerId, 'events', eventId);
        batch.delete(eventToDeleteRef);

        const containerRef = doc(db, 'containers', containerId);
        if (previousEventData) {
            batch.update(containerRef, {
                currentStatus: previousEventData.status,
                currentLocation: previousEventData.details.newLocation,
                lastUpdatedAt: serverTimestamp()
            });
        } else {
            // This case should ideally not happen if revert is disabled for the first event
            batch.update(containerRef, {
                currentStatus: "In Yard",
                currentLocation: "Yard",
                lastUpdatedAt: serverTimestamp()
            });
        }

        await batch.commit();
        closeDetailsModal();

    } catch (error) {
        console.error("Error reverting event:", error);
    }
}

export function stopListeningForContainers() { if (containersUnsubscribe) { containersUnsubscribe(); containersUnsubscribe = null; } }
async function handleViewContainer(containerId) {
    currentContainerId = containerId;
    try {
        const containerDocRef = doc(db, 'containers', containerId);
        const containerDocSnap = await getDoc(containerDocRef);
        if (!containerDocSnap.exists()) { console.error("Container not found!"); return; }
        const eventsRef = collection(db, 'containers', containerId, 'events');
        const q = query(eventsRef, orderBy('timestamp', 'desc'));
        const eventsSnapshot = await getDocs(q);
        const events = eventsSnapshot.docs;
        populateDetailsModal(containerDocSnap, events);
        openDetailsModal();
    } catch (error) { console.error("Error fetching container details:", error); }
}
export async function populateDropdowns(target = 'all') {
    if (target === 'trucks') await populateSelectWithOptions('trucks', 'truck', 'truckName');
    else if (target === 'chassis') await populateSelectWithOptions('chassis', 'chassis', 'chassisName');
    else if (target === 'all' || target === 'bookings') await populateSelectWithOptions('bookings', 'bookingNumber', 'bookingNumber');
}
async function populateSelectWithOptions(collectionName, selectId, textField) {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) return;
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
    } catch (error) { console.error(`Error populating ${collectionName}:`, error); }
}

