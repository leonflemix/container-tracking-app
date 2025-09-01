// js/main.js
// This is the main entry point for the application.
// It imports functions from other modules and sets up event listeners.

import { monitorAuthState, handleLogin, handleLogout } from './auth.js';
import { uiElements, toggleMobileSidebar, openNewContainerModal, closeNewContainerModal } from './ui.js';
import { handleNewContainerSubmit } from './firestore.js';

document.addEventListener('DOMContentLoaded', () => {
    // Start listening for authentication changes
    monitorAuthState();

    // Attach all event listeners
    uiElements.loginForm.addEventListener('submit', handleLogin);
    uiElements.logoutButton.addEventListener('click', handleLogout);
    uiElements.toggleSidebar.addEventListener('click', toggleMobileSidebar);
    uiElements.sidebarBackdrop.addEventListener('click', toggleMobileSidebar);
    uiElements.newContainerBtn.addEventListener('click', openNewContainerModal);
    uiElements.closeModalBtn.addEventListener('click', closeNewContainerModal);
    uiElements.cancelModalBtn.addEventListener('click', closeNewContainerModal);
    uiElements.newContainerForm.addEventListener('submit', handleNewContainerSubmit);
});

