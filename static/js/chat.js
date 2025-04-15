// static/js/chat.js
document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const chatInput = document.getElementById('chatInput');
    const chatBox = document.getElementById('chatBox');
    const uploadButton = document.getElementById('uploadButton');
    const sendButton = document.getElementById('sendButton');
    const imageUpload = document.getElementById('imageUpload');
    const messageInput = document.getElementById('messageInput');
    const newImageButton = document.getElementById('newImageButton');
    
    let currentImagePath = '';
    let currentDescription = '';
    let styleGoals = '';
    
    // Handle image upload
    uploadButton.addEventListener('click', async () => {
        const file = imageUpload.files[0];
        if (!file) {
            alert('Please select an image to upload.');
            return;
        }
        
        // Create form data
        const formData = new FormData();
        formData.append('image', file);
        
        // Show loading message
        addMessage('Analyzing your outfit...', 'bot');
        
        try {
            // Upload and analyze image
            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Save image path and description
                currentImagePath = data.image_path;
                currentDescription = data.description;
                
                // Show chat input and new image button
                uploadArea.style.display = 'none';
                chatInput.style.display = 'flex';
                newImageButton.style.display = 'block';
                
                // Add a message asking about style goals
                addMessage('I\'ve analyzed your outfit. Before I give you advice, could you tell me a bit about what you\'re going for with this look? Any specific occasion or style you\'re aiming for?', 'bot');
                
                // First message will be treated as style goals
                styleGoals = '';
            } else {
                addMessage('Sorry, there was an error analyzing your outfit.', 'bot');
            }
        } catch (error) {
            console.error('Error:', error);
            addMessage('Sorry, there was an error processing your request.', 'bot');
        }
    });
    
    // Handle sending messages
    sendButton.addEventListener('click', async () => {
        const message = messageInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        addMessage(message, 'user');
        messageInput.value = '';
        
        // If this is the first message, treat it as style goals
        if (styleGoals === '') {
            styleGoals = message;
            
            // Skip the extra question and go directly to processing the input
            // Create form data for immediate analysis with default question
            const formData = new FormData();
            formData.append('image_path', currentImagePath);
            formData.append('description', currentDescription);
            formData.append('user_input', 'What do you think of this outfit?');
            formData.append('style_goals', styleGoals);
            
            try {
                // Show loading message
                addMessage('Analyzing your style preferences...', 'bot');
                
                // Get fashion advice
                const response = await fetch('/api/advice', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    addMessage(data.advice, 'bot');
                } else {
                    addMessage('Sorry, there was an error getting fashion advice.', 'bot');
                }
            } catch (error) {
                console.error('Error:', error);
                addMessage('Sorry, there was an error processing your request.', 'bot');
            }
            
            return;
        }
        
        // Create form data for subsequent questions
        const formData = new FormData();
        formData.append('image_path', currentImagePath);
        formData.append('description', currentDescription);
        formData.append('user_input', message);
        formData.append('style_goals', styleGoals);
        
        try {
            // Get fashion advice
            const response = await fetch('/api/advice', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                addMessage(data.advice, 'bot');
            } else {
                addMessage('Sorry, there was an error getting fashion advice.', 'bot');
            }
        } catch (error) {
            console.error('Error:', error);
            addMessage('Sorry, there was an error processing your request.', 'bot');
        }
    });
    
    // Handle new image button click
    newImageButton.addEventListener('click', () => {
        // Reset state
        currentImagePath = '';
        currentDescription = '';
        styleGoals = '';
        
        // Clear chat box
        chatBox.innerHTML = '';
        
        // Show upload area, hide chat input
        uploadArea.style.display = 'block';
        chatInput.style.display = 'none';
        newImageButton.style.display = 'none';
        
        // Clear file input
        imageUpload.value = '';
    });
    
    // Function to add a message to the chat
    function addMessage(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = sender + '-message';
        messageDiv.textContent = message;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});