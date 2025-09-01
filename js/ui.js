// js/ui.js
// Manages all interactions with the user interface (DOM manipulation).

import { populateDropdowns } from './firestore.js';

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
    const isManagerOrAdmin = role === 'admin' || role === 'manager';
    
    document.body.dataset.userRole = role; // Set role on body for CSS selectors if needed

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
    if (lowerStatus.includes('workshop')) return 'status-danger';
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
    uiElements.detailsModalTitle.textContent = `Container: ${containerDoc.id}`;
    
    // Populate current info
    uiElements.currentContainerInfo.innerHTML = `
        <p><strong>Booking #:</strong> ${containerDoc.data().bookingNumber}</p>
        <p><strong>Current Status:</strong> <span class="status ${getStatusClass(containerDoc.data().currentStatus)}">${containerDoc.data().currentStatus}</span></p>
        <p><strong>Current Location:</strong> ${containerDoc.data().currentLocation}</p>
    `;

    // Populate event history
    uiElements.eventHistoryList.innerHTML = '';
    if (events.length === 0) {
        uiElements.eventHistoryList.innerHTML = '<p>No history found for this container.</p>';
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
                <p>User: ${eventData.userId.substring(0,8)}... | Location: ${eventData.details.newLocation || containerDoc.data().currentLocation}</p>
            </div>
        `;
        uiElements.eventHistoryList.appendChild(eventEl);
    });
}

