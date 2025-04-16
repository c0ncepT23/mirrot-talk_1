// static/js/auth.js - Updated with temporary mock functionality
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    const profileButton = document.getElementById('profileButton');
    const loginModal = document.getElementById('loginModal');
    const closeModal = document.querySelector('.close-modal');
    const loginForm = document.getElementById('loginForm');
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    const analysesContainer = document.getElementById('analysesContainer');
    
    // Initialize auth functionality
    function initAuth() {
        // Check if user is logged in
        updateAuthUI();
        
        // Login button event
        loginButton.addEventListener('click', () => {
            showLoginModal();
        });
        
        // Logout button event
        logoutButton.addEventListener('click', async () => {
            await logout();
        });
        
        // Profile button event
        profileButton.addEventListener('click', () => {
            loadUserProfile();
        });
        
        // Close modal when clicking X
        closeModal.addEventListener('click', () => {
            loginModal.style.display = 'none';
        });
        
        // Handle login form submission
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await login();
        });
        
        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                loginModal.style.display = 'none';
            }
        });
    }
    
    // Show login modal
    function showLoginModal() {
        loginModal.style.display = 'flex';
    }
    
    // TEMPORARY: Login function using localStorage instead of API
    async function login() {
        const email = document.getElementById('loginEmail').value;
        
        if (!email || !validateEmail(email)) {
            alert('Please enter a valid email address');
            return;
        }
        
        try {
            // Store user email and mock token in localStorage
            const mockToken = btoa(JSON.stringify({sub: email, exp: Date.now() + 604800000})); // 7 days
            localStorage.setItem('user_email', email);
            localStorage.setItem('access_token', mockToken);
            
            // Set a cookie to simulate backend cookie
            document.cookie = `access_token=${mockToken}; path=/; max-age=604800`;
            
            // Close modal and update UI
            loginModal.style.display = 'none';
            updateAuthUI();
            
            // Show success message
            showMessage('Successfully logged in!', 'success');
            
            // Process pending image upload if exists
            if (window.pendingImageUpload) {
                handlePendingUpload();
            }
            
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during login.');
        }
    }
    
    // TEMPORARY: Logout function using localStorage instead of API
    async function logout() {
        try {
            // Clear stored user data
            localStorage.removeItem('user_email');
            localStorage.removeItem('access_token');
            
            // Clear cookie
            document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            
            // Update UI
            updateAuthUI();
            
            // If on profile screen, redirect to welcome
            if (document.getElementById('profileScreen').style.display !== 'none') {
                window.app.showScreen('welcome');
            }
            
            // Show success message
            showMessage('Successfully logged out!', 'success');
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during logout.');
        }
    }
    
    // Update UI based on auth state
    function updateAuthUI() {
        const isLoggedIn = getCookie('access_token') !== "";
        
        if (isLoggedIn) {
            loginButton.style.display = 'none';
            logoutButton.style.display = 'flex';
            profileButton.style.display = 'flex';
            
            // Update email display if on profile screen
            const userEmail = getUserEmailFromToken();
            if (userEmail) {
                userEmailDisplay.textContent = userEmail;
            }
        } else {
            loginButton.style.display = 'flex';
            logoutButton.style.display = 'none';
            profileButton.style.display = 'none';
        }
    }
    
    // TEMPORARY: Load user profile with mock data
    function loadUserProfile() {
        window.app.showScreen('profile');
        
        // Get user email
        const userEmail = getUserEmailFromToken();
        userEmailDisplay.textContent = userEmail || 'User';
        
        // Show loading state
        analysesContainer.innerHTML = `
            <div class="loading-indicator">
                <div class="spinner"></div>
            </div>
            <p>Loading your style history...</p>
        `;
        
        // For now, show empty state since we don't have real data
        setTimeout(() => {
            displayEmptyAnalyses();
        }, 1000);
    }
    
    // Display user's analyses
    function displayAnalyses(analyses) {
        let html = '';
        
        analyses.forEach(analysis => {
            const date = new Date(analysis.timestamp);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            html += `
                <div class="analysis-card">
                    <img src="${analysis.image_path}" alt="Outfit analysis" class="analysis-image">
                    <div class="analysis-details">
                        <div class="analysis-rating">Score: ${extractRating(analysis.description)}/100</div>
                        <div class="analysis-description">${extractQuickTake(analysis.description)}</div>
                        <div class="analysis-date">${formattedDate}</div>
                        <button class="view-details-button" data-id="${analysis.id}">View Details</button>
                    </div>
                </div>
            `;
        });
        
        analysesContainer.innerHTML = html;
        
        // Add event listeners to view details buttons
        document.querySelectorAll('.view-details-button').forEach(button => {
            button.addEventListener('click', () => {
                alert('View details functionality coming soon!');
            });
        });
    }
    
    // Display empty analyses state
    function displayEmptyAnalyses() {
        analysesContainer.innerHTML = `
            <div class="empty-analyses">
                <i class="fas fa-tshirt"></i>
                <p>You haven't analyzed any outfits yet.</p>
                <button class="secondary-button" id="startAnalyzingButton">Start Analyzing</button>
            </div>
        `;
        
        document.getElementById('startAnalyzingButton').addEventListener('click', () => {
            window.app.showScreen('occasion');
            window.app.resetAndStartOver();
        });
    }
    
    // Handle pending upload after login
    function handlePendingUpload() {
        alert('You can now upload multiple images!');
        
        // Get the current image file
        const currentFile = window.pendingImageUpload;
        window.pendingImageUpload = null;
        
        // Trigger the image upload flow
        if (currentFile) {
            // Need to set it in the input element first
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(currentFile);
            document.getElementById('imageUpload').files = dataTransfer.files;
            
            // Then trigger the next button
            document.getElementById('nextButton').click();
        }
    }
    
    // Show message to user
    function showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `user-message ${type}`;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
    
    // Helper: Extract rating from analysis text
    function extractRating(text) {
        const match = text.match(/# Outfit Rating: (\d+)\/100/);
        return match ? match[1] : "85";
    }
    
    // Helper: Extract quick take from analysis text
    function extractQuickTake(text) {
        const match = text.match(/## Quick Take\s*([^#]+)/);
        return match ? match[1].trim() : "No quick take available";
    }
    
    // Helper: Get cookie value
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return "";
    }
    
    // Helper: Get user email from token
    function getUserEmailFromToken() {
        const token = getCookie('access_token');
        if (!token) return null;
        
        try {
            // Get payload from JWT token
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.sub;
        } catch (e) {
            console.error('Error parsing token:', e);
            return null;
        }
    }
    
    // Helper: Validate email format
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Initialize auth when DOM is loaded
    initAuth();
    
    // Expose login modal function globally
    window.showLoginModal = showLoginModal;
});