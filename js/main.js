// js/main.js
import { monitorAuthState, handleLogin, handleLogout } from './auth.js';
import { initializeUI } from './ui/elements.js';
import { toggleMobileSidebar, openNewContainerModal, closeNewContainerModal, closeDetailsModal } from './ui/actions.js';
import { handleNewContainerSubmit, handleUpdateStatusSubmit, handleDeleteLastEvent } from './firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize UI elements references AFTER the DOM is loaded
    const uiElements = initializeUI();
    
    // 2. Start authentication monitoring
    monitorAuthState();

    // Attach all static event listeners
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
        const targetButton = e.target.closest('button');
        if (!targetButton) return;

        const form = targetButton.closest('form');
        if (form && form.id === 'updateStatusForm' && targetButton.type === 'submit') {
            e.preventDefault();
            // Pass the specific button that was clicked to the handler
            handleUpdateStatusSubmit(targetButton); 
        }

        if (targetButton.classList.contains('delete-event-btn')) {
            const { containerId, eventId, previousEvent } = targetButton.dataset;
            if (confirm('Are you sure you want to revert this last event? This cannot be undone.')) {
                handleDeleteLastEvent(containerId, eventId, JSON.parse(previousEvent));
            }
        }
    });
});

