// js/ui/elements.js
// This module is solely responsible for finding and exporting references to all the DOM elements.

export let uiElements = {};

export function initializeUI() {
    uiElements = {
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
        closeNewContainerModalBtn: document.getElementById('closeNewContainerModalBtn'),
        cancelNewContainerModalBtn: document.getElementById('cancelNewContainerModalBtn'),
        newContainerForm: document.getElementById('newContainerForm'),
        formError: document.getElementById('formError'),
        containerDetailsModal: document.getElementById('containerDetailsModal'),
        closeDetailsModalBtn: document.getElementById('closeDetailsModalBtn'),
        detailsModalTitle: document.getElementById('detailsModalTitle'),
        currentContainerInfo: document.getElementById('currentContainerInfo'),
        eventHistoryList: document.getElementById('eventHistoryList'),
        updateStatusContainer: document.getElementById('updateStatusContainer'),
    };
    return uiElements;
}
