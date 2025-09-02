// js/main.js
import { monitorAuthState, handleLogin, handleLogout } from './auth.js';
import { uiElements, toggleMobileSidebar, openNewContainerModal, closeNewContainerModal, closeDetailsModal } from './ui.js';
import { handleNewContainerSubmit, handleUpdateStatusSubmit, handleDeleteLastEvent } from './firestore.js';

document.addEventListener('DOMContentLoaded', () => {
    monitorAuthState();

    // Attach all event listeners
    uiElements.loginForm.addEventListener('submit', handleLogin);
    uiElements.logoutButton.addEventListener('click', handleLogout);
    uiElements.toggleSidebar.addEventListener('click', toggleMobileSidebar);
    uiElements.sidebarBackdrop.addEventListener('click', toggleMobileSidebar);
    
    // New Container Modal Listeners
    uiElements.newContainerBtn.addEventListener('click', openNewContainerModal);
    uiElements.closeNewContainerModalBtn.addEventListener('click', closeNewContainerModal);
    uiElements.cancelNewContainerModalBtn.addEventListener('click', closeNewContainerModal);
    uiElements.newContainerForm.addEventListener('submit', handleNewContainerSubmit);

    // Container Details Modal Listeners
    uiElements.closeDetailsModalBtn.addEventListener('click', closeDetailsModal);
    
    // Use event delegation for the dynamic form submissions and buttons
    uiElements.containerDetailsModal.addEventListener('click', (e) => {
        const submitButton = e.target.closest('button[type="submit"]');
        if (submitButton) {
            const form = submitButton.closest('form');
            if (form && form.id === 'updateStatusForm') {
                e.preventDefault(); // Prevent default form submission
                handleUpdateStatusSubmit(e); // Pass the click event
            }
        }

        const revertButton = e.target.closest('.delete-event-btn');
        if (revertButton) {
            const { containerId, eventId, previousEvent } = revertButton.dataset;
            if (confirm('Are you sure you want to revert this last event? This cannot be undone.')) {
                handleDeleteLastEvent(containerId, eventId, JSON.parse(previousEvent));
            }
        }
    });
});

