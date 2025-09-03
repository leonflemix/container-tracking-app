// js/ui/actions.js
// This module contains functions that control UI state (showing/hiding elements, modals, etc.).
import { uiElements } from './elements.js';
import { populateDropdowns } from '../firestore.js';

export function showApp() { 
    uiElements.loginPage.style.display = 'none';
    uiElements.appContainer.style.display = 'flex';
}

export function showLogin() { 
    uiElements.appContainer.style.display = 'none';
    uiElements.loginPage.style.display = 'flex';
}

export function setUserRoleUI(role, email) {
    document.body.dataset.userRole = role;
    if (!uiElements.adminElements) return;

    uiElements.adminElements.forEach(el => el.style.display = 'none');
    uiElements.managerElements.forEach(el => el.style.display = 'none');
    
    if (role === 'admin') {
        uiElements.userAvatar.textContent = 'A'; uiElements.userAvatar.style.background = '#ef4444';
        uiElements.userName.textContent = email; uiElements.userRole.textContent = 'Admin';
        uiElements.adminElements.forEach(el => { el.style.display = el.tagName === 'BUTTON' || el.classList.contains('menu-item') ? 'flex' : 'grid'; });
        uiElements.managerElements.forEach(el => { el.style.display = el.tagName === 'BUTTON' || el.classList.contains('menu-item') ? 'flex' : 'grid'; });
    } else if (role === 'manager') {
        uiElements.userAvatar.textContent = 'M'; uiElements.userAvatar.style.background = '#f59e0b';
        uiElements.userName.textContent = email; uiElements.userRole.textContent = 'Manager';
        uiElements.managerElements.forEach(el => { el.style.display = el.tagName === 'BUTTON' || el.classList.contains('menu-item') ? 'flex' : 'grid'; });
    } else {
        uiElements.userAvatar.textContent = email ? email.charAt(0).toUpperCase() : '?'; uiElements.userAvatar.style.background = '#64748b';
        uiElements.userName.textContent = email; uiElements.userRole.textContent = 'Viewer';
    }
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

export function openDetailsModal() { 
    uiElements.containerDetailsModal.classList.remove('hidden'); 
}

export function closeDetailsModal() { 
    uiElements.containerDetailsModal.classList.add('hidden'); 
}

