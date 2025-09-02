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
    
    // Event delegation for dynamic forms and buttons inside the modal
    uiElements.containerDetailsModal.addEventListener('submit', (e) => {
        if (e.target.id === 'updateStatusForm') {
            handleUpdateStatusSubmit(e);
        }
    });

    uiElements.containerDetailsModal.addEventListener('click', (e) => {
        const targetButton = e.target.closest('.delete-event-btn');
        if (targetButton) {
            const { containerId, eventId, previousEvent } = targetButton.dataset;
            // A custom confirmation modal would be better than window.confirm in a real app
            if (confirm('Are you sure you want to revert this last event? This cannot be undone.')) {
                handleDeleteLastEvent(containerId, eventId, JSON.parse(previousEvent));
            }
        }
    });
});

