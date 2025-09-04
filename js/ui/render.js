// js/ui/render.js
// This module handles all functions that render or update the UI with data.
import { uiElements } from './elements.js';
import { populateDropdowns } from '../firestore.js';
import { getUserName } from '../users.js';

let currentContainerForModal = null;

export function getStatusClass(status, location) {
    if (!status) return 'status-pending';
    const lowerStatus = status.toLowerCase();
    
    if (lowerStatus.includes('tilter') || lowerStatus.includes('loading complete')) {
        if (location && location.toLowerCase() === 'shred') return 'status-tilter-blue';
        if (location && (location.toLowerCase() === 'track' || location.toLowerCase() === 'scale')) return 'status-tilter-yellow';
    }
    
    if (['🤛🏻💨', '👨🏻‍🏭', '🛞', '🏗', 'at workshop'].some(s => status.includes(s))) return 'status-action-required';
    if (lowerStatus.includes('yard')) return 'status-in-transit';
    if (lowerStatus.includes('pier')) return 'status-delivered';
    if (lowerStatus.includes('ready')) return 'status-success';

    return 'status-pending';
}

export function renderContainersTable(containers, onViewClick) {
    if (!uiElements.containersTableBody) return;
    uiElements.containersTableBody.innerHTML = '';
    if (!containers || containers.length === 0) {
        uiElements.containersTableBody.innerHTML = '<tr><td colspan="5">No containers found.</td></tr>';
        return;
    }
    containers.forEach(container => {
        const statusClass = getStatusClass(container.currentStatus, container.currentLocation);
        const collectedDate = container.collectedAt ? container.collectedAt.toDate().toLocaleDateString('en-CA') : 'N/A';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${container.id}</td>
            <td>${collectedDate}</td>
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

function renderEventHistory(events) {
    uiElements.eventHistoryList.innerHTML = '';
    if (events.length === 0) {
        uiElements.eventHistoryList.innerHTML = '<p>No history found for this container.</p>';
        return;
    }

    events.forEach((event, index) => {
        const eventData = event.data();
        const timestamp = eventData.timestamp ? eventData.timestamp.toDate().toLocaleString('en-CA') : 'No date';
        
        let revertButtonHTML = '';
        if (index === 0 && eventData.status !== 'Collected from Pier' && document.body.dataset.userRole === 'admin') {
            const previousEvent = events[1] ? events[1].data() : null;
            revertButtonHTML = `<button class="action-btn btn-danger delete-event-btn" 
                                    data-container-id="${currentContainerForModal.id}" 
                                    data-event-id="${event.id}"
                                    data-previous-event='${JSON.stringify(previousEvent)}'>
                                <i class="fas fa-trash"></i> Revert
                             </button>`;
        }

        const eventEl = document.createElement('div');
        eventEl.className = 'event-item';
        eventEl.innerHTML = `
            <div class="event-header">
                <span>${eventData.status}</span>
                <div class="event-actions">
                    ${revertButtonHTML}
                    <span class="event-time">${timestamp}</span>
                </div>
            </div>
            <div class="event-details">
                <p>User: ${getUserName(eventData.userId)} | Location: ${eventData.details.newLocation || 'N/A'}</p>
            </div>
        `;
        uiElements.eventHistoryList.appendChild(eventEl);
    });
}

function renderUpdateForm(container) {
    const containerDiv = uiElements.updateStatusContainer;
    containerDiv.innerHTML = '';
    let formHTML = '';
    const status = container.currentStatus;

    if (status === 'In Yard') {
        formHTML = `
            <h3>Place in Tilter</h3>
            <form id="updateStatusForm">
                <div class="form-group">
                    <label for="tilterLocation">Tilter Location</label>
                    <select id="tilterLocation" required>
                        <option value="SHRED">SHRED</option>
                        <option value="SCALE">SCALE</option>
                        <option value="TRACK">TRACK</option>
                    </select>
                </div>
                <button type="submit" class="action-btn btn-primary" data-action="placeInTilter">Update Status</button>
            </form>
        `;
    } else if (status === 'Placed in Tilter') {
        formHTML = `
            <h3>Mark as Loading Complete</h3>
            <form id="updateStatusForm">
                 <div class="form-group">
                    <label for="tilterLocation">Confirm Location</label>
                    <select id="tilterLocation" required>
                        <option value="SHRED" ${container.currentLocation === 'SHRED' ? 'selected' : ''}>SHRED</option>
                        <option value="SCALE" ${container.currentLocation === 'SCALE' ? 'selected' : ''}>SCALE</option>
                        <option value="TRACK" ${container.currentLocation === 'TRACK' ? 'selected' : ''}>TRACK</option>
                    </select>
                </div>
                <button type="submit" class="action-btn btn-primary" data-action="loadingComplete">Mark as Complete</button>
            </form>
        `;
    } else if (status === 'Loading Complete') {
        formHTML = `
            <h3>Weigh Container</h3>
            <form id="updateStatusForm">
                <div class="form-group">
                    <label for="weighAmount">Weight</label>
                    <input type="number" id="weighAmount" placeholder="e.g., 42000" required>
                </div>
                <div class="form-group">
                    <label for="sealNumber">Seal Number</label>
                    <input type="text" id="sealNumber" placeholder="e.g., C123456" required>
                </div>
                <div class="form-group">
                    <label for="truck">Truck</label>
                    <select id="truck" required><option>Loading...</option></select>
                </div>
                <div class="form-group">
                    <label for="chassis">Chassis</label>
                    <select id="chassis" required><option>Loading...</option></select>
                </div>
                <button type="submit" class="action-btn btn-primary" data-action="weighContainer">Save Weight & Details</button>
            </form>
        `;
    } else if (status === 'Post-Weighing' || ['🤛🏻💨', '👨🏻‍🏭', '🛞', '🏗', 'At Workshop'].some(s => status.includes(s))) {
         formHTML = `
            <h3>Assign Follow-up Actions</h3>
            <form id="updateStatusForm">
                 <div class="form-group">
                    <label for="nextActions">Required Actions (select one or more)</label>
                    <select id="nextActions" multiple style="height: 100px;">
                        <option value="🤛🏻💨">Needs Squishing</option>
                        <option value="👨🏻‍🏭">Needs Repairs</option>
                        <option value="🛞">Chassis Tire Repairs</option>
                    </select>
                     <small>Hold Ctrl/Cmd to select multiple. If no issues, leave blank and click "Mark as Ready".</small>
                </div>
                <button type="submit" class="action-btn btn-primary" data-action="assignNextAction">Update Actions</button>
                 <hr>
                 <div class="form-group">
                    <label>Or, assign final disposition:</label>
                    <button type="submit" class="action-btn btn-secondary" data-action="moveToMathers">Move to IH Mathers</button>
                    <button type="submit" class="action-btn btn-danger" data-action="moveToWorkshop">Take to Workshop</button>
                    <button type="submit" class="action-btn btn-success" data-action="markAsReady">Mark as Ready for Pier</button>
                </div>
            </form>
        `;
    } else if (status === '👍🏻 Ready for Pier') {
         formHTML = `
            <h3>Mark as Returned to Pier</h3>
            <form id="updateStatusForm">
                <p>This will mark the container as complete and ready for billing.</p>
                <button type="submit" class="action-btn btn-primary" data-action="returnToPier">Return to Pier</button>
            </form>
        `;
    } else if (status === 'Returned to Pier' && document.body.dataset.userRole === 'admin') {
         formHTML = `
            <h3>Re-activate Rejected Container</h3>
            <form id="updateStatusForm">
                <p class="form-error" style="display:block;">Admin Only: This container was rejected. Re-activate to mark it for squishing.</p>
                <button type="submit" class="action-btn btn-danger" data-action="reactivate">Re-activate</button>
            </form>
        `;
    }

    containerDiv.innerHTML = formHTML;

    // IMPORTANT: Populate dropdowns AFTER the form is in the DOM
    if (status === 'Loading Complete') {
        populateDropdowns('trucks');
        populateDropdowns('chassis');
    }
}

export function populateDetailsModal(containerDoc, events) {
    currentContainerForModal = { id: containerDoc.id, ...containerDoc.data() };
    uiElements.detailsModalTitle.textContent = `Container: ${containerDoc.id}`;
    const data = currentContainerForModal;
    uiElements.currentContainerInfo.innerHTML = `<p><strong>Booking #:</strong> ${data.bookingNumber}</p><p><strong>Current Status:</strong> <span class="status ${getStatusClass(data.currentStatus, data.currentLocation)}">${data.currentStatus}</span></p><p><strong>Current Location:</strong> ${data.currentLocation}</p>`;
    renderEventHistory(events);
    renderUpdateForm(data);
}

