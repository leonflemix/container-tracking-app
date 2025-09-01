// js/ui.js
// Manages all interactions with the user interface (DOM manipulation).

import { populateDropdowns } from './firestore.js';

let currentContainerForModal = null; // Store data for the container currently in the details modal

// --- UI Element References ---
export const uiElements = {
    loginPage: document.getElementById('loginPage'),
    appContainer: document.getElementById('appContainer'),
    loginForm: document.getElementById('loginForm'),
    logoutButton: document.getElementById('logoutButton'),
    userAvatar: document.getElementById('userAvatar'),
    userName: document.getElementById('userName'),
    userRole: document.getElementById('userRole'),
    adminElements: document.querySelectorAll('.admin-only'),
    managerElements: document.querySelectorAll('.manager-only'),
    toggleSidebar: document.getElementById('toggleSidebar'),
    sidebar: document.getElementById('sidebar'),
    sidebarBackdrop: document.getElementById('sidebarBackdrop'),
    containersTableBody: document.getElementById('containers-table-body'),
    // New Container Modal
    newContainerModal: document.getElementById('newContainerModal'),
    newContainerBtn: document.getElementById('newContainerBtn'),
    closeNewContainerModalBtn: document.getElementById('closeNewContainerModalBtn'),
    cancelNewContainerModalBtn: document.getElementById('cancelNewContainerModalBtn'),
    newContainerForm: document.getElementById('newContainerForm'),
    formError: document.getElementById('formError'),
    // Details Modal
    containerDetailsModal: document.getElementById('containerDetailsModal'),
    closeDetailsModalBtn: document.getElementById('closeDetailsModalBtn'),
    detailsModalTitle: document.getElementById('detailsModalTitle'),
    currentContainerInfo: document.getElementById('currentContainerInfo'),
    eventHistoryList: document.getElementById('eventHistoryList'),
    updateStatusForm: document.getElementById('updateStatusForm'),
    updateFormError: document.getElementById('updateFormError'),
    newStatus: document.getElementById('newStatus'),
    locationFormGroup: document.getElementById('locationFormGroup'),
    locationInputContainer: document.getElementById('locationInputContainer'),
};

// --- UI Functions ---
export function showApp() {
    uiElements.loginPage.style.display = 'none';
    uiElements.appContainer.style.display = 'block';
}

export function showLogin() {
    uiElements.appContainer.style.display = 'none';
    uiElements.loginPage.style.display = 'flex';
}

export function setUserRoleUI(role, email) {
    document.body.dataset.userRole = role;

    uiElements.adminElements.forEach(el => el.style.display = 'none');
    uiElements.managerElements.forEach(el => el.style.display = 'none');

    if (role === 'admin') {
        uiElements.userAvatar.textContent = 'A';
        uiElements.userAvatar.style.background = '#ef4444';
        uiElements.userName.textContent = email;
        uiElements.userRole.textContent = 'Admin';
        uiElements.adminElements.forEach(el => { el.style.display = el.tagName === 'BUTTON' || el.classList.contains('menu-item') ? 'flex' : 'grid'; });
        uiElements.managerElements.forEach(el => { el.style.display = el.tagName === 'BUTTON' || el.classList.contains('menu-item') ? 'flex' : 'grid'; });
    } else if (role === 'manager') {
        uiElements.userAvatar.textContent = 'M';
        uiElements.userAvatar.style.background = '#f59e0b';
        uiElements.userName.textContent = email;
        uiElements.userRole.textContent = 'Manager';
        uiElements.managerElements.forEach(el => { el.style.display = el.tagName === 'BUTTON' || el.classList.contains('menu-item') ? 'flex' : 'grid'; });
    } else {
        uiElements.userAvatar.textContent = email.charAt(0).toUpperCase();
        uiElements.userAvatar.style.background = '#64748b';
        uiElements.userName.textContent = email;
        uiElements.userRole.textContent = 'Viewer';
    }
}

export function renderContainersTable(containers, onViewClick) {
    uiElements.containersTableBody.innerHTML = '';
    if (!containers || containers.length === 0) {
        uiElements.containersTableBody.innerHTML = '<tr><td colspan="5">No containers found.</td></tr>';
        return;
    }
    containers.forEach(container => {
        const statusClass = getStatusClass(container.currentStatus);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${container.id}</td>
            <td>${container.bookingNumber || 'N/A'}</td>
            <td>${container.currentLocation || 'N/A'}</td>
            <td><span class="status ${statusClass}">${container.currentStatus}</span></td>
            <td>
                <button class="action-btn btn-secondary view-btn">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        row.querySelector('.view-btn').addEventListener('click', () => onViewClick(container.id));
        uiElements.containersTableBody.appendChild(row);
    });
}


function getStatusClass(status) {
    if (!status) return 'status-pending';
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('transit') || lowerStatus.includes('yard')) return 'status-in-transit';
    if (lowerStatus.includes('delivered') || lowerStatus.includes('pier')) return 'status-delivered';
    if (lowerStatus.includes('alert') || lowerStatus.includes('hold')) return 'status-alert';
    if (lowerStatus.includes('tilter')) return 'status-warning';
    if (lowerStatus.includes('workshop') || lowerStatus.includes('squish')) return 'status-danger';
    return 'status-pending';
}

export function toggleMobileSidebar() {
    uiElements.sidebar.classList.toggle('active');
    uiElements.sidebarBackdrop.classList.toggle('active');
}

export async function openNewContainerModal() {
    uiElements.newContainerForm.reset();
    uiElements.formError.style.display = 'none';
    await populateDropdowns();
    uiElements.newContainerModal.classList.remove('hidden');
}

export function closeNewContainerModal() {
    uiElements.newContainerModal.classList.add('hidden');
}

// --- Details Modal UI Functions ---
export function openDetailsModal() {
    uiElements.containerDetailsModal.classList.remove('hidden');
}

export function closeDetailsModal() {
    uiElements.containerDetailsModal.classList.add('hidden');
}

export function populateDetailsModal(containerDoc, events) {
    currentContainerForModal = { id: containerDoc.id, ...containerDoc.data() };
    
    uiElements.detailsModalTitle.textContent = `Container: ${containerDoc.id}`;
    
    uiElements.currentContainerInfo.innerHTML = `
        <p><strong>Booking #:</strong> ${containerDoc.data().bookingNumber}</p>
        <p><strong>Current Status:</strong> <span class="status ${getStatusClass(containerDoc.data().currentStatus)}">${containerDoc.data().currentStatus}</span></p>
        <p><strong>Current Location:</strong> ${containerDoc.data().currentLocation}</p>
    `;

    uiElements.eventHistoryList.innerHTML = '';
    if (events.length === 0) {
        uiElements.eventHistoryList.innerHTML = '<p>No history found.</p>';
        return;
    }

    events.forEach(event => {
        const eventData = event.data();
        const timestamp = eventData.timestamp ? eventData.timestamp.toDate().toLocaleString('en-CA') : 'No date';
        const eventEl = document.createElement('div');
        eventEl.className = 'event-item';
        eventEl.innerHTML = `
            <div class="event-header">
                <span>${eventData.status}</span>
                <span class="event-time">${timestamp}</span>
            </div>
            <div class="event-details">
                <p>User: ${eventData.userId ? eventData.userId.substring(0,8) : 'N/A'}... | Location: ${eventData.details.newLocation || 'N/A'}</p>
            </div>
        `;
        uiElements.eventHistoryList.appendChild(eventEl);
    });

    // Set initial state for the update form
    uiElements.updateStatusForm.reset();
    uiElements.updateFormError.style.display = 'none';
    uiElements.newStatus.value = containerDoc.data().currentStatus || 'In Yard';
    handleStatusChange(); // Trigger the logic to show the correct location input
}

export function handleStatusChange() {
    const selectedStatus = uiElements.newStatus.value;
    const locationFormGroup = uiElements.locationFormGroup;
    const locationInputContainer = uiElements.locationInputContainer;
    locationInputContainer.innerHTML = ''; // Clear previous input

    switch (selectedStatus) {
        case 'Placed in Tilter':
            locationFormGroup.style.display = 'block';
            const select = document.createElement('select');
            select.id = 'newLocation';
            select.className = 'form-control'; // Ensure styling
            select.innerHTML = `
                <option value="SHRED">SHRED</option>
                <option value="SCALE">SCALE</option>
                <option value="TRACK">TRACK</option>
            `;
            locationInputContainer.appendChild(select);
            break;

        case 'Loading Complete':
            locationFormGroup.style.display = 'block';
            const input = document.createElement('input');
            input.type = 'text';
            input.id = 'newLocation';
            input.required = true;
            
            const lastLocation = currentContainerForModal.currentLocation || '';
            if (lastLocation.match(/SHRED|SCALE|TRACK/i)) {
                 input.value = lastLocation;
            } else {
                input.placeholder = "Confirm tilter location (e.g., SHRED)";
            }
            locationInputContainer.appendChild(input);
            break;
        
        case 'In Yard':
        case 'Sent to Workshop':
        case 'Squish':
        case 'Ready':
        case 'Returned to Pier':
            locationFormGroup.style.display = 'none';
            break;
        
        default:
            locationFormGroup.style.display = 'block';
             const defaultInput = document.createElement('input');
            defaultInput.type = 'text';
            defaultInput.id = 'newLocation';
            defaultInput.required = true;
            defaultInput.placeholder = 'Enter location';
            locationInputContainer.appendChild(defaultInput);
            break;
    }
}

