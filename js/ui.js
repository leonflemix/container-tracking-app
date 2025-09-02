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
    updateStatusContainer: document.getElementById('updateStatusContainer'),
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
        const statusClass = getStatusClass(container.currentStatus, container.currentLocation);
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


export function getStatusClass(status, location) {
    if (!status) return 'status-pending';
    const lowerStatus = status.toLowerCase();
    
    if (lowerStatus.includes('tilter') || lowerStatus.includes('loading complete')) {
        if (location && location.toLowerCase() === 'shred') return 'status-tilter-blue';
        if (location && (location.toLowerCase() === 'track' || location.toLowerCase() === 'scale')) return 'status-tilter-yellow';
    }
    
    if (['⚖️', '🤛🏻💨', '👨🏻‍🏭', '🛞', '🏗'].includes(status)) return 'status-action-required';
    if (lowerStatus.includes('yard')) return 'status-in-transit';
    if (lowerStatus.includes('pier')) return 'status-delivered';
    if (lowerStatus.includes('ready')) return 'status-success';

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
    
    const data = currentContainerForModal;
    uiElements.currentContainerInfo.innerHTML = `
        <p><strong>Booking #:</strong> ${data.bookingNumber}</p>
        <p><strong>Current Status:</strong> <span class="status ${getStatusClass(data.currentStatus, data.currentLocation)}">${data.currentStatus}</span></p>
        <p><strong>Current Location:</strong> ${data.currentLocation}</p>
    `;

    renderEventHistory(events, data.currentLocation);
    renderUpdateForm(data); // New function to render the dynamic form
}
function renderEventHistory(events, currentLocation) {
    // ... existing event history rendering logic ...
}

function renderUpdateForm(container) {
    const containerDiv = uiElements.updateStatusContainer;
    containerDiv.innerHTML = ''; // Clear previous form
    let formHTML = '';
    const status = container.currentStatus;

    if (status === 'In Yard') {
        formHTML = `
            <h3>Place in Tilter</h3>
            <form id="updateStatusForm" data-action="placeInTilter">
                <div class="form-group">
                    <label for="tilterLocation">Tilter Location</label>
                    <select id="tilterLocation" required>
                        <option value="SHRED">SHRED</option>
                        <option value="SCALE">SCALE</option>
                        <option value="TRACK">TRACK</option>
                    </select>
                </div>
                <button type="submit" class="action-btn btn-primary">Update Status</button>
            </form>
        `;
    } else if (status === 'Placed in Tilter') {
         formHTML = `
            <h3>Mark as Loading Complete</h3>
            <form id="updateStatusForm" data-action="loadingComplete">
                 <div class="form-group">
                    <label for="tilterLocation">Confirm Location</label>
                    <select id="tilterLocation" required>
                        <option value="SHRED" ${container.currentLocation === 'SHRED' ? 'selected' : ''}>SHRED</option>
                        <option value="SCALE" ${container.currentLocation === 'SCALE' ? 'selected' : ''}>SCALE</option>
                        <option value="TRACK" ${container.currentLocation === 'TRACK' ? 'selected' : ''}>TRACK</option>
                    </select>
                </div>
                <button type="submit" class="action-btn btn-primary">Mark as Complete</button>
            </form>
        `;
    } else if (status === 'Loading Complete') {
        formHTML = `
            <h3>Weigh Container</h3>
            <form id="updateStatusForm" data-action="weighContainer">
                <div class="form-group">
                    <label for="weighAmount">Weight</label>
                    <input type="number" id="weighAmount" placeholder="e.g., 42000" required>
                </div>
                <div class="form-group">
                    <label for="truck">Truck</label>
                    <select id="truck" required><option>Loading...</option></select>
                </div>
                <div class="form-group">
                    <label for="chassis">Chassis</label>
                    <select id="chassis" required><option>Loading...</option></select>
                </div>
                <button type="submit" class="action-btn btn-primary">Save Weight</button>
            </form>
        `;
        populateDropdowns('truck');
        populateDropdowns('chassis');
    } else if (status === '⚖️ Needs Weighing') {
         formHTML = `
            <h3>Assign Post-Weighing Status</h3>
            <form id="updateStatusForm" data-action="assignNextAction">
                 <div class="form-group">
                    <label for="nextAction">Next Action</label>
                    <select id="nextAction" required>
                        <option value="🤛🏻💨">Needs Squishing</option>
                        <option value="👨🏻‍🏭">Needs Repairs</option>
                        <option value="🛞">Chassis Tire Repairs</option>
                        <option value="🏗">Storage (IH Mathers)</option>
                        <option value="👍🏻">Ready for Pier</option>
                    </select>
                </div>
                <button type="submit" class="action-btn btn-primary">Assign Action</button>
            </form>
        `;
    } else if (['🤛🏻💨', '👨🏻‍🏭', '🛞', '🏗', '👍🏻'].includes(status)) {
         formHTML = `
            <h3>Mark as Returned to Pier</h3>
            <form id="updateStatusForm" data-action="returnToPier">
                <p>This will mark the container as complete.</p>
                <button type="submit" class="action-btn btn-primary">Return to Pier</button>
            </form>
        `;
    } else if (status === 'Returned to Pier' && document.body.dataset.userRole === 'admin') {
         formHTML = `
            <h3>Re-activate Rejected Container</h3>
            <form id="updateStatusForm" data-action="reactivate">
                <p class="form-error" style="display:block;">Admin Only: This container was rejected. Re-activate to mark it for squishing.</p>
                <button type="submit" class="action-btn btn-danger">Re-activate</button>
            </form>
        `;
    }

    containerDiv.innerHTML = formHTML;
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

