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
    newContainerModal: document.getElementById('newContainerModal'),
    newContainerBtn: document.getElementById('newContainerBtn'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn'),
    newContainerForm: document.getElementById('newContainerForm'),
    formError: document.getElementById('formError'),
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

export function renderContainersTable(containers) {
    uiElements.containersTableBody.innerHTML = '';
    if (!containers || containers.length === 0) {
        uiElements.containersTableBody.innerHTML = '<tr><td colspan="5">No containers found.</td></tr>';
        return;
    }
    containers.forEach(container => {
        const statusClass = getStatusClass(container.currentStatus);
        const row = `
            <tr>
                <td>${container.id}</td>
                <td>${container.bookingNumber || 'N/A'}</td>
                <td>${container.currentLocation || 'N/A'}</td>
                <td><span class="status ${statusClass}">${container.currentStatus}</span></td>
                <td>
                    <button class="action-btn btn-secondary">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
        uiElements.containersTableBody.innerHTML += row;
    });
}

function getStatusClass(status) {
    if (!status) return 'status-pending';
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('transit') || lowerStatus.includes('yard')) return 'status-in-transit';
    if (lowerStatus.includes('delivered')) return 'status-delivered';
    if (lowerStatus.includes('alert') || lowerStatus.includes('hold')) return 'status-alert';
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

