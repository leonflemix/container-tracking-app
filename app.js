// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, onSnapshot, getDocs, writeBatch, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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
    // --- Page and UI Elements ---
    const loginPage = document.getElementById('loginPage');
    const appContainer = document.getElementById('appContainer');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const logoutButton = document.getElementById('logoutButton');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    const adminElements = document.querySelectorAll('.admin-only');
    const managerElements = document.querySelectorAll('.manager-only');
    const toggleSidebar = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    const containersTableBody = document.getElementById('containers-table-body');
    
    // --- New Container Modal Elements ---
    const newContainerModal = document.getElementById('newContainerModal');
    const newContainerBtn = document.getElementById('newContainerBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const newContainerForm = document.getElementById('newContainerForm');
    const formError = document.getElementById('formError');

    let containersUnsubscribe = null;

    // --- Authentication ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            let role = 'viewer';
            if (userDocSnap.exists()) {
               role = userDocSnap.data().role;
            }
            loginPage.style.display = 'none';
            appContainer.style.display = 'block';
            setUserRole(role, user.email);
            listenForContainers();
        } else {
            appContainer.style.display = 'none';
            loginPage.style.display = 'flex';
            if (containersUnsubscribe) containersUnsubscribe();
        }
    });

    // --- Event Listeners ---
    loginForm.addEventListener('submit', handleLogin);
    logoutButton.addEventListener('click', handleLogout);
    toggleSidebar.addEventListener('click', toggleMobileSidebar);
    sidebarBackdrop.addEventListener('click', toggleMobileSidebar);
    newContainerBtn.addEventListener('click', openNewContainerModal);
    closeModalBtn.addEventListener('click', closeNewContainerModal);
    cancelModalBtn.addEventListener('click', closeNewContainerModal);
    newContainerForm.addEventListener('submit', handleNewContainerSubmit);

    // --- Functions ---
    function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        loginError.style.display = 'none';
        signInWithEmailAndPassword(auth, email, password)
            .catch(error => {
                console.error("Login Error:", error);
                loginError.textContent = "Invalid email or password.";
                loginError.style.display = 'block';
            });
    }

    function handleLogout() {
        signOut(auth).catch(error => console.error("Logout Error:", error));
    }

    function toggleMobileSidebar() {
        sidebar.classList.toggle('active');
        sidebarBackdrop.classList.toggle('active');
    }
    
    // --- New Container Modal Functions ---
    async function openNewContainerModal() {
        newContainerForm.reset();
        formError.style.display = 'none';
        await populateDropdowns();
        newContainerModal.classList.remove('hidden');
    }

    function closeNewContainerModal() {
        newContainerModal.classList.add('hidden');
    }

    async function populateDropdowns() {
        await populateSelectWithOptions('bookings', 'bookingNumber', 'bookingNumber', 'bookingNumber');
        await populateSelectWithOptions('trucks', 'truck', 'truckName');
        await populateSelectWithOptions('chassis', 'chassis', 'chassisName');
    }

    async function populateSelectWithOptions(collectionName, selectId, textField) {
        const selectElement = document.getElementById(selectId);
        try {
            const querySnapshot = await getDocs(collection(db, collectionName));
            selectElement.innerHTML = `<option value="">-- Select ${selectId} --</option>`;
            querySnapshot.forEach(doc => {
                const data = doc.data();
                const option = document.createElement('option');
                option.value = doc.id; // Use the document ID as the value for robust referencing
                option.textContent = data[textField];
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error(`Error populating ${collectionName}:`, error);
            selectElement.innerHTML = `<option value="">Error loading data</option>`;
        }
    }

    async function handleNewContainerSubmit(e) {
        e.preventDefault();
        const containerNumber = document.getElementById('containerNumber').value.trim().toUpperCase();
        const bookingId = document.getElementById('bookingNumber').value;
        const truckId = document.getElementById('truck').value;
        const chassisId = document.getElementById('chassis').value;

        if (!containerNumber || !bookingId || !truckId || !chassisId) {
            formError.textContent = 'Please fill out all fields.';
            formError.style.display = 'block';
            return;
        }
        
        const currentUser = auth.currentUser;
        if (!currentUser) {
             formError.textContent = 'You must be logged in to perform this action.';
             formError.style.display = 'block';
             return;
        }

        try {
            // Get the actual booking number string from the booking document
            const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
            const bookingNumberString = bookingDoc.exists() ? bookingDoc.data().bookingNumber : 'Unknown';

            const batch = writeBatch(db);
            
            // 1. Create the main container document
            const containerRef = doc(db, 'containers', containerNumber);
            batch.set(containerRef, {
                bookingNumber: bookingNumberString,
                currentStatus: "In Yard",
                currentLocation: "Yard - Section A",
                lastUpdatedAt: serverTimestamp()
            });

            // 2. Create the first event in the subcollection
            const eventRef = doc(collection(db, 'containers', containerNumber, 'events'));
            batch.set(eventRef, {
                status: "Collected from Pier",
                timestamp: serverTimestamp(),
                userId: currentUser.uid,
                details: {
                    truckId: truckId,
                    chassisId: chassisId
                }
            });

            await batch.commit();
            closeNewContainerModal();

        } catch (error) {
            console.error("Error saving new container:", error);
            formError.textContent = 'Failed to save container. Please try again.';
            formError.style.display = 'block';
        }
    }
    
    // --- Real-time Container Data ---
    function listenForContainers() {
        const containersRef = collection(db, 'containers');
        containersUnsubscribe = onSnapshot(containersRef, (snapshot) => {
            containersTableBody.innerHTML = '';
            if (snapshot.empty) {
                containersTableBody.innerHTML = '<tr><td colspan="5">No containers found.</td></tr>';
                return;
            }
            snapshot.forEach(doc => {
                const container = doc.data();
                const containerId = doc.id;
                const statusClass = getStatusClass(container.currentStatus);
                const row = `
                    <tr>
                        <td>${containerId}</td>
                        <td>${container.bookingNumber || 'N/A'}</td>
                        <td>${container.currentLocation || 'N/A'}</td>
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
        if (lowerStatus.includes('transit') || lowerStatus.includes('yard')) return 'status-in-transit';
        if (lowerStatus.includes('delivered')) return 'status-delivered';
        if (lowerStatus.includes('alert') || lowerStatus.includes('hold')) return 'status-alert';
        return 'status-pending';
    }

    function setUserRole(role, email) {
        adminElements.forEach(el => el.style.display = 'none');
        managerElements.forEach(el => el.style.display = 'none');
        if (role === 'admin') {
            userAvatar.textContent = 'A';
            userAvatar.style.background = '#ef4444';
            userName.textContent = email;
            userRole.textContent = 'Admin';
            adminElements.forEach(el => { el.style.display = el.tagName === 'BUTTON' || el.classList.contains('menu-item') ? 'flex' : 'grid'; });
            managerElements.forEach(el => { el.style.display = el.tagName === 'BUTTON' || el.classList.contains('menu-item') ? 'flex' : 'grid'; });
        } else if (role === 'manager') {
            userAvatar.textContent = 'M';
            userAvatar.style.background = '#f59e0b';
            userName.textContent = email;
            userRole.textContent = 'Manager';
            managerElements.forEach(el => { el.style.display = el.tagName === 'BUTTON' || el.classList.contains('menu-item') ? 'flex' : 'grid'; });
        } else {
            userAvatar.textContent = email.charAt(0).toUpperCase();
            userAvatar.style.background = '#64748b';
            userName.textContent = email;
            userRole.textContent = 'Viewer';
        }
    }
});

