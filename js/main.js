// js/main.js
import { loadPartials } from './htmlLoader.js';
import { monitorAuthState, handleLogin, handleLogout } from './auth.js';
import { initializeUI, toggleMobileSidebar, openNewContainerModal, closeNewContainerModal, closeDetailsModal } from './ui.js';
import { handleNewContainerSubmit, handleUpdateStatusSubmit, handleDeleteLastEvent } from './firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load all HTML partials first
    await loadPartials();

    // 2. Now that the DOM is complete, initialize UI elements and attach listeners
    const uiElements = initializeUI();
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
                e.preventDefault();
                handleUpdateStatusSubmit(e);
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

