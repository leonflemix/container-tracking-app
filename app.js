// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// TODO: Add your own Firebase configuration from your Firebase project settings
const firebaseConfig = {
            apiKey: "AIzaSyACbLKXVKBb6DJhCvZVQPq_36LYXQnowtI",
            authDomain: "container-tracker-app-9e667.firebaseapp.com",
            projectId: "container-tracker-app-9e667",
            storageBucket: "container-tracker-app-9e667.firebasestorage.app",
            messagingSenderId: "54664527552",
            appId: "1:54664527552:web:e249a4b6df1afab555f725"
        };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', function() {
    // Page elements
    const loginPage = document.getElementById('loginPage');
    const appContainer = document.getElementById('appContainer');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const logoutButton = document.getElementById('logoutButton');

    // App UI elements
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    const adminElements = document.querySelectorAll('.admin-only');
    const managerElements = document.querySelectorAll('.manager-only');
    const toggleSidebar = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    const containersTableBody = document.getElementById('containers-table-body');
    
    let containersUnsubscribe = null; // To hold the listener cleanup function

    // Listen for authentication state changes
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            let role = 'viewer'; // Default role
            if (userDocSnap.exists()) {
               role = userDocSnap.data().role;
            }

            loginPage.style.display = 'none';
            appContainer.style.display = 'block';
            setUserRole(role, user.email);
            
            // Start listening for container data
            listenForContainers();

        } else {
            appContainer.style.display = 'none';
            loginPage.style.display = 'flex';
            
            // Stop listening for container data if user logs out
            if (containersUnsubscribe) {
                containersUnsubscribe();
            }
        }
    });

    // Login functionality
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        loginError.style.display = 'none';

        signInWithEmailAndPassword(auth, email, password)
            .catch((error) => {
                console.error("Login Error:", error);
                loginError.textContent = "Invalid email or password.";
                loginError.style.display = 'block';
            });
    });

    // Logout functionality
    logoutButton.addEventListener('click', function() {
        signOut(auth).catch((error) => {
            console.error("Logout Error:", error);
        });
    });
    
    // Toggle sidebar on mobile
    toggleSidebar.addEventListener('click', function() {
        sidebar.classList.toggle('active');
        sidebarBackdrop.classList.toggle('active');
    });

    // Close sidebar when backdrop is clicked
    sidebarBackdrop.addEventListener('click', function() {
        sidebar.classList.remove('active');
        sidebarBackdrop.classList.remove('active');
    });
    
    // --- Real-time Container Data ---
    function listenForContainers() {
        const containersRef = collection(db, 'containers');
        containersUnsubscribe = onSnapshot(containersRef, (snapshot) => {
            containersTableBody.innerHTML = ''; // Clear existing table data
            if (snapshot.empty) {
                containersTableBody.innerHTML = '<tr><td colspan="5">No containers found.</td></tr>';
                return;
            }
            
            snapshot.forEach(doc => {
                const container = doc.data();
                const containerId = doc.id; // The document ID is the container number
                
                const statusClass = getStatusClass(container.currentStatus);

                const row = `
                    <tr>
                        <td>${containerId}</td>
                        <td>${container.origin || 'N/A'}</td>
                        <td>${container.destination || 'N/A'}</td>
                        <td><span class="status ${statusClass}">${container.currentStatus}</span></td>
                        <td>
                            <button class="action-btn btn-secondary">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `;
                containersTableBody.innerHTML += row;
            });
        }, (error) => {
            console.error("Error listening for containers:", error);
            containersTableBody.innerHTML = '<tr><td colspan="5">Error loading data.</td></tr>';
        });
    }
    
    function getStatusClass(status) {
        if (!status) return 'status-pending';
        const lowerStatus = status.toLowerCase();
        if (lowerStatus.includes('transit')) return 'status-in-transit';
        if (lowerStatus.includes('delivered')) return 'status-delivered';
        if (lowerStatus.includes('alert') || lowerStatus.includes('hold')) return 'status-alert';
        return 'status-pending'; // Default
    }

    function setUserRole(role, email) {
        adminElements.forEach(el => el.style.display = 'none');
        managerElements.forEach(el => el.style.display = 'none');

        if (role === 'admin') {
            userAvatar.textContent = 'A';
            userAvatar.style.background = '#ef4444';
            userName.textContent = email;
            userRole.textContent = 'Admin';
            
            adminElements.forEach(el => {
                el.style.display = el.tagName === 'BUTTON' || el.classList.contains('menu-item') ? 'flex' : 'grid';
            });
            managerElements.forEach(el => {
               el.style.display = el.tagName === 'BUTTON' || el.classList.contains('menu-item') ? 'flex' : 'grid';
            });
            
        } else if (role === 'manager') {
            userAvatar.textContent = 'M';
            userAvatar.style.background = '#f59e0b';
            userName.textContent = email;
            userRole.textContent = 'Manager';
            
             managerElements.forEach(el => {
               el.style.display = el.tagName === 'BUTTON' || el.classList.contains('menu-item') ? 'flex' : 'grid';
            });
            
        } else { // Default to viewer
            userAvatar.textContent = email.charAt(0).toUpperCase();
            userAvatar.style.background = '#64748b';
            userName.textContent = email;
            userRole.textContent = 'Viewer';
        }
    }
});

