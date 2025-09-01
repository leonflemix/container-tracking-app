// js/main.js
// This is the main entry point for the application.
// It imports functions from other modules and sets up event listeners.

import { monitorAuthState, handleLogin, handleLogout } from './auth.js';
import { uiElements, toggleMobileSidebar, openNewContainerModal, closeNewContainerModal, closeDetailsModal } from './ui.js';
import { handleNewContainerSubmit, handleUpdateStatusSubmit } from './firestore.js';

document.addEventListener('DOMContentLoaded', () => {
    // Start listening for authentication changes
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
    uiElements.updateStatusForm.addEventListener('submit', handleUpdateStatusSubmit);
});

