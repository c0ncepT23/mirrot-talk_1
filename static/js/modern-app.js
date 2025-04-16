// static/js/modern-app.js
document.addEventListener('DOMContentLoaded', function() {
    const screens = {
        welcome: document.getElementById('welcomeScreen'),
        occasion: document.getElementById('occasionScreen'),
        analysis: document.getElementById('analysisScreen'),
        feedback: document.getElementById('feedbackScreen'),
        profile: document.getElementById('profileScreen')
    };
    
    const elements = {
        startButton: document.getElementById('startButton'),
        uploadArea: document.getElementById('uploadArea'),
        imageUpload: document.getElementById('imageUpload'),
        nextButton: document.getElementById('nextButton'),
        occasionSelect: document.getElementById('occasionSelect'),
        outfitPreview: document.getElementById('outfitPreview'),
        outfitPreviewSmall: document.getElementById('outfitPreviewSmall'),
        ratingScore: document.getElementById('ratingScore'),
        quickTakeContent: document.getElementById('quickTakeContent'),
        highlightsContent: document.getElementById('highlightsContent'),
        colorAnalysisContent: document.getElementById('colorAnalysisContent'),
        suggestionsContent: document.getElementById('suggestionsContent'),
        tabButtons: document.querySelectorAll('.tab-button'),
        toneButtons: document.querySelectorAll('.tone-button'),
        chatInput: document.getElementById('chatInput'),
        sendButton: document.getElementById('sendButton'),
        newPhotoButton: document.getElementById('newPhotoButton'),
        backButtons: document.querySelectorAll('.back-button'),
        shareButton: document.getElementById('shareButton')
    };
    
    // State variables
    let currentImageFile = null;
    let currentImagePath = '';
    let currentDescription = '';
    let styleGoals = '';
    let selectedTone = 'gentle';
    let feedbackData = null;
    
    // Initialize event listeners
    function initEvents() {
        // Welcome screen
        elements.startButton.addEventListener('click', () => showScreen('occasion'));
        
        // Occasion screen
        elements.uploadArea.addEventListener('click', () => elements.imageUpload.click());
        elements.imageUpload.addEventListener('change', handleImageSelect);
        elements.nextButton.addEventListener('click', handleImageUpload);
        
        // Back buttons
        elements.backButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetScreen = button.getAttribute('data-target');
                showScreen(targetScreen);
            });
        });
        
        // Feedback screen
        elements.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all tabs
                elements.tabButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab
                button.classList.add('active');
                const tabId = button.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });
        
        elements.toneButtons.forEach(button => {
            button.addEventListener('click', () => {
                elements.toneButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                selectedTone = button.getAttribute('data-tone');
                // Here you would ideally regenerate the feedback with the new tone
                // updateFeedbackWithTone(selectedTone);
            });
        });
        
        elements.sendButton.addEventListener('click', sendChatMessage);
        elements.chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
        
        elements.newPhotoButton.addEventListener('click', resetAndStartOver);
        
        // Share button
        elements.shareButton.addEventListener('click', shareAnalysis);
    }
    
    // Show a specific screen
    function showScreen(screenName) {
        Object.keys(screens).forEach(key => {
            screens[key].style.display = 'none';
        });
        screens[screenName].style.display = 'block';
    }
    
    // Handle image selection
    function handleImageSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        currentImageFile = file;
        
        // Preview the image
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewUrl = e.target.result;
            
            // Enable the next button once an image is selected
            elements.nextButton.disabled = false;
            
            // Show image preview in upload area
            elements.uploadArea.innerHTML = `<img src="${previewUrl}" alt="Selected outfit" style="max-width: 100%; max-height: 200px;">`;
        };
        reader.readAsDataURL(file);
    }
    
    // Handle image upload
    async function handleImageUpload() {
        if (!currentImageFile) return;
        
        // Check if anonymous user is trying to upload a second image
        const isLoggedIn = isUserLoggedIn();
        //const hasUploadedBefore = getCookie('anonymous_session_id') !== "";
        const hasUploadedBefore = localStorage.getItem('has_uploaded') === 'true';
        
        if (!isLoggedIn && hasUploadedBefore) {
            // Save current upload intent
            window.pendingImageUpload = currentImageFile;
            // Show login modal
            window.showLoginModal();
            return;
        }

        // Mark that user has uploaded an image
        localStorage.setItem('has_uploaded', 'true');
        
        // Get selected occasion
        styleGoals = elements.occasionSelect.value;
        
        // Show analysis screen
        showScreen('analysis');
        
        // Preview the image
        const reader = new FileReader();
        reader.onload = function(e) {
            elements.outfitPreview.src = e.target.result;
        };
        reader.readAsDataURL(currentImageFile);
        
        // Create form data
        const formData = new FormData();
        formData.append('image', currentImageFile);
        
        try {
            // Upload and analyze image
            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Save image path and description
                currentImagePath = data.image_path;
                currentDescription = data.description;
                
                // Get feedback based on style goals
                await getFashionAdvice();
            } else if (data.requires_login) {
                // User needs to login to continue
                window.showLoginModal();
            } else {
                throw new Error(data.message || 'Unknown error occurred');
            }
        } catch (error) {
            console.error('Error:', error);
            // Show error message to user
            alert(`Sorry, there was an error analyzing your outfit: ${error.message}`);
            showScreen('occasion');
        }
    }
    
    // Get fashion advice
    async function getFashionAdvice() {
        try {
            // Create form data
            const formData = new FormData();
            formData.append('image_path', currentImagePath);
            formData.append('description', currentDescription);
            formData.append('user_input', 'rate out of 100 and provide commentary');
            formData.append('style_goals', styleGoals);
            
            // Get fashion advice
            const response = await fetch('/api/advice', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Process and display the feedback
                processFeedback(data.advice);
                
                // Show preview image on feedback screen
                elements.outfitPreviewSmall.src = elements.outfitPreview.src;
                
                // Show feedback screen
                showScreen('feedback');
            } else {
                throw new Error(data.message || 'Unknown error occurred');
            }
        } catch (error) {
            console.error('Error:', error);
            alert(`Sorry, there was an error getting fashion advice: ${error.message}`);
            // Fall back to occasion screen
            showScreen('occasion');
        }
    }
    
    // Process feedback and extract sections
    function processFeedback(feedbackText) {
        try {
            // Parse rating
            const ratingMatch = feedbackText.match(/# Outfit Rating: (\d+)\/100/);
            const rating = ratingMatch ? ratingMatch[1] : "85";
            elements.ratingScore.textContent = rating;
            
            // Parse Quick Take
            const quickTakeMatch = feedbackText.match(/## Quick Take\s*([^#]+)/);
            const quickTake = quickTakeMatch ? quickTakeMatch[1].trim() : "No quick take available";
            elements.quickTakeContent.textContent = quickTake;
            
            // Parse Highlights
            const highlightsMatch = feedbackText.match(/## Highlights\s*([^#]+)/);
            const highlights = highlightsMatch ? highlightsMatch[1].trim() : "No highlights available";
            elements.highlightsContent.textContent = highlights;
            
            // Parse Color Analysis
            const colorMatch = feedbackText.match(/## Color Analysis\s*([^#]+)/);
            const colorAnalysis = colorMatch ? colorMatch[1].trim() : "No color analysis available";
            elements.colorAnalysisContent.textContent = colorAnalysis;
            
            // Parse Suggestions
            const suggestionsMatch = feedbackText.match(/## Suggestions\s*([^#]+)/);
            let suggestions = "No suggestions available";
            
            if (suggestionsMatch) {
                const suggestionText = suggestionsMatch[1].trim();
                const suggestionItems = suggestionText.split('*').filter(item => item.trim() !== '');
                
                if (suggestionItems.length > 0) {
                    // Clear the suggestions list
                    elements.suggestionsContent.innerHTML = '';
                    
                    // Add each suggestion as a list item
                    suggestionItems.forEach(item => {
                        const li = document.createElement('li');
                        li.textContent = item.trim();
                        elements.suggestionsContent.appendChild(li);
                    });
                } else {
                    elements.suggestionsContent.innerHTML = '<li>No specific suggestions available</li>';
                }
            } else {
                elements.suggestionsContent.innerHTML = '<li>No suggestions available</li>';
            }
            
            // Save the full feedback data for reference
            feedbackData = feedbackText;
            
        } catch (error) {
            console.error('Error processing feedback:', error);
            // Fallback to showing raw feedback
            elements.quickTakeContent.textContent = "Error processing feedback";
            elements.highlightsContent.textContent = feedbackText;
            elements.colorAnalysisContent.textContent = "Please try again";
            elements.suggestionsContent.innerHTML = '<li>Unable to process suggestions</li>';
        }
    }
    
    // Send a chat message
    async function sendChatMessage() {
        const message = elements.chatInput.value.trim();
        if (!message) return;
        
        // Clear input
        elements.chatInput.value = '';
        
        // Create a temporary display of the message
        const chatContainer = document.querySelector('.feedback-content');
        const userMessageDiv = document.createElement('div');
        userMessageDiv.className = 'user-message';
        userMessageDiv.innerHTML = `<p>${message}</p>`;
        chatContainer.appendChild(userMessageDiv);
        
        const botTypingDiv = document.createElement('div');
        botTypingDiv.className = 'bot-typing';
        botTypingDiv.innerHTML = '<p>Thinking...</p>';
        chatContainer.appendChild(botTypingDiv);
        
        try {
            // Create form data
            const formData = new FormData();
            formData.append('image_path', currentImagePath);
            formData.append('description', currentDescription);
            formData.append('user_input', message);
            formData.append('style_goals', styleGoals);
            
            // Get fashion advice
            const response = await fetch('/api/advice', {
                method: 'POST',
                body: formData
            });
            
            // Remove the typing indicator
            chatContainer.removeChild(botTypingDiv);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Display the response
                const botMessageDiv = document.createElement('div');
                botMessageDiv.className = 'bot-message';
                botMessageDiv.innerHTML = `<p>${data.advice}</p>`;
                chatContainer.appendChild(botMessageDiv);
                
                // Scroll to the bottom
                chatContainer.scrollTop = chatContainer.scrollHeight;
            } else {
                throw new Error(data.message || 'Unknown error occurred');
            }
        } catch (error) {
            console.error('Error:', error);
            
            // Display error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'bot-message error';
            errorDiv.innerHTML = `<p>Sorry, there was an error: ${error.message}</p>`;
            chatContainer.appendChild(errorDiv);
            
            // Scroll to the bottom
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }
    
    // Share analysis via WhatsApp
    function shareAnalysis() {
        // Get rating and quick take
        const rating = elements.ratingScore.textContent;
        const quickTake = elements.quickTakeContent.textContent;
        
        // Create share text
        const shareText = `Check out my outfit rating: ${rating}/100! "${quickTake}" - Analyzed by StyleMirror`;
        
        // Create WhatsApp share URL
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        
        // Open WhatsApp in new window
        window.open(whatsappUrl, '_blank');
    }
    
    // Reset and start over
    function resetAndStartOver() {
        // Reset state
        currentImageFile = null;
        currentImagePath = '';
        currentDescription = '';
        styleGoals = '';
        feedbackData = null;
        
        // Reset UI elements
        elements.imageUpload.value = '';
        elements.uploadArea.innerHTML = `
            <i class="fas fa-camera"></i>
            <p>Upload Photo</p>
        `;
        elements.nextButton.disabled = true;
        
        // Show the occasion screen
        showScreen('occasion');
    }
    
    // Helper function to get cookie value
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return "";
    }
    
    // Helper function to check if user is logged in
    function isUserLoggedIn() {
        return getCookie('access_token') !== "";
    }
    
    // Initialize
    initEvents();
    showScreen('welcome');
    
    // Expose functions for auth.js
    window.app = {
        showScreen,
        resetAndStartOver
    };
});