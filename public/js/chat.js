// Chat Controller for handling chat-specific functionality
class ChatController {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Emotion detection
        document.getElementById('emotion-btn')?.addEventListener('click', () => {
            this.showEmotionModal();
        });

        document.getElementById('close-emotion-modal')?.addEventListener('click', () => {
            this.hideEmotionModal();
        });

        document.getElementById('start-emotion-detection')?.addEventListener('click', () => {
            this.startEmotionDetection();
        });

        document.getElementById('capture-emotion')?.addEventListener('click', () => {
            this.captureEmotion();
        });

        document.getElementById('send-emotion')?.addEventListener('click', () => {
            this.sendEmotionMessage();
        });

        // Artistic filter
        document.getElementById('mood-btn')?.addEventListener('click', () => {
            this.showMoodModal();
        });

        document.getElementById('close-mood-modal')?.addEventListener('click', () => {
            this.hideMoodModal();
        });

        document.getElementById('start-mood-camera')?.addEventListener('click', () => {
            this.startMoodCamera();
        });

        document.getElementById('capture-mood-image')?.addEventListener('click', () => {
            this.captureMoodImage();
        });

        document.getElementById('send-mood-image')?.addEventListener('click', () => {
            this.sendMoodMessage();
        });
    }

    // Emotion Detection Methods
    showEmotionModal() {
        const modal = document.getElementById('emotion-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.resetEmotionModal();
        }
    }

    hideEmotionModal() {
        const modal = document.getElementById('emotion-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.stopEmotionCamera();
        }
    }

    resetEmotionModal() {
        // Reset UI elements
        document.getElementById('start-emotion-detection')?.classList.remove('hidden');
        document.getElementById('capture-emotion')?.classList.add('hidden');
        document.getElementById('emotion-result')?.classList.add('hidden');
        
        // Clear previous results
        const emotionText = document.getElementById('detected-emotion');
        const confidenceText = document.getElementById('emotion-confidence');
        if (emotionText) emotionText.textContent = '';
        if (confidenceText) confidenceText.textContent = '';
    }

    async startEmotionDetection() {
        try {
            const video = document.getElementById('emotion-video');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                } 
            });
            
            video.srcObject = stream;
            
            // Update UI
            document.getElementById('start-emotion-detection')?.classList.add('hidden');
            document.getElementById('capture-emotion')?.classList.remove('hidden');
            
            showToast('Camera started! Position your face in the frame', 'info');
        } catch (error) {
            console.error('Error accessing camera:', error);
            showToast('Unable to access camera. Please check permissions.', 'error');
        }
    }

    async captureEmotion() {
        const video = document.getElementById('emotion-video');
        const canvas = document.getElementById('emotion-canvas');
        
        if (!video || !canvas) return;

        // Set canvas dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        // Convert to blob
        canvas.toBlob(async (blob) => {
            try {
                // For now, simulate emotion detection
                // In production, you would send this to your emotion detection API
                console.log('🎭 Starting emotion detection...');
                const mockEmotion = await this.simulateEmotionDetection(blob);
                console.log('🎭 Emotion detection result:', mockEmotion);
                
                this.displayEmotionResult(mockEmotion);
            } catch (error) {
                console.error('Error detecting emotion:', error);
                showToast('Failed to detect emotion. Please try again.', 'error');
            }
        }, 'image/jpeg', 0.8);
    }

    async simulateEmotionDetection(imageBlob) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 🎯 FIXED: Only detect Happy, Neutral, and Angry emotions - NO CONSECUTIVE REPEATS
        console.log('🚨 USING CHAT.JS EMOTION FUNCTION - NO CONSECUTIVE DUPLICATES!');
        
        let availableEmotions = [
            { emotion: 'Happy', confidence: 0.85 + Math.random() * 0.1 },
            { emotion: 'Neutral', confidence: 0.79 + Math.random() * 0.15 },
            { emotion: 'Angry', confidence: 0.82 + Math.random() * 0.12 }
        ];
        
        // 🚫 Filter out the last detected emotion to prevent consecutive duplicates
        if (window.lastDetectedEmotion) {
            const filteredEmotions = availableEmotions.filter(e => e.emotion !== window.lastDetectedEmotion);
            
            // Only use filtered emotions if we have alternatives, otherwise allow repeat
            if (filteredEmotions.length > 0) {
                availableEmotions = filteredEmotions;
                console.log(`🚫 Filtered out last emotion: ${window.lastDetectedEmotion}`);
            } else {
                console.log(`⚠️ No alternatives available, allowing repeat of: ${window.lastDetectedEmotion}`);
            }
        }
        
        // DEBUG: Show available emotions after filtering
        console.log('Available emotions (after filter):', availableEmotions.map(e => e.emotion));
        
        const selectedEmotion = availableEmotions[Math.floor(Math.random() * availableEmotions.length)];
        
        // Ensure confidence doesn't exceed 1.0
        selectedEmotion.confidence = Math.min(selectedEmotion.confidence, 0.99);

        // 💾 Store this emotion as the last detected for next time
        window.lastDetectedEmotion = selectedEmotion.emotion;

        console.log('🎭 Emotion detected (chat.js):', selectedEmotion.emotion, 'with confidence:', selectedEmotion.confidence.toFixed(2));
        console.log('💾 Stored as last emotion for next detection');
        
        return selectedEmotion;
    }

    displayEmotionResult(emotionData) {
        const emotionText = document.getElementById('detected-emotion');
        const confidenceText = document.getElementById('emotion-confidence');
        const resultContainer = document.getElementById('emotion-result');
        
        if (emotionText) {
            // 🎨 Apply emotion-specific styling and emoji
            const emotionClass = `emotion-${emotionData.emotion.toLowerCase()}`;
            
            // 🎭 Emoji mapping for each emotion
            let emotionEmoji = '😐'; // Default neutral
            if (emotionData.emotion === 'Happy') emotionEmoji = '😊';
            else if (emotionData.emotion === 'Angry') emotionEmoji = '😡';
            
            emotionText.textContent = `${emotionData.emotion} ${emotionEmoji}`;
            emotionText.className = `emotion-text ${emotionClass}`;
        }
        
        if (confidenceText) confidenceText.style.display = 'none'; // Hide confidence text
        if (resultContainer) resultContainer.classList.remove('hidden');
        
        // Hide capture button
        document.getElementById('capture-emotion')?.classList.add('hidden');
        
        // Store emotion data for sending
        this.currentEmotion = emotionData;
        
        // 🎉 Enhanced success message with emoji - removed notification
    }

    sendEmotionMessage() {
        if (!this.currentEmotion || !window.chatApp) return;

        // Check socket connection
        if (!window.chatApp.socket || !window.chatApp.socket.connected) {
            showToast('Not connected to server. Please refresh the page.', 'error');
            return;
        }

        // Debug: Check current user
        console.log('🐛 Debug - Current user (emotion):', window.chatApp.currentUser);
        console.log('🐛 Debug - Current user ID (emotion):', window.chatApp.currentUser?.id);
        
        const messageData = {
            content: `Feeling ${this.currentEmotion.emotion}`,
            messageType: 'emotion',
            emotionData: this.currentEmotion,
            sender: window.chatApp.currentUser.id // Add sender ID
        };
        
        console.log('🐛 Debug - Emotion message data:', messageData);

        // Add receiver ID and send using unified handler - handle both id and _id formats
        const receiverId = window.chatApp.currentChatUser.id || window.chatApp.currentChatUser._id;
        messageData.receiverId = receiverId;

        // Add reply data if replying to a message
        if (window.chatApp.replyToMessage) {
            messageData.replyTo = window.chatApp.replyToMessage._id;
        }
        
        console.log('📤 Sending emotion message to:', window.chatApp.currentChatUser.username, 'ID:', receiverId);
        
        window.chatApp.socket.emit('send_message', messageData, (response) => {
            if (response && !response.success) {
                showToast('Failed to send emotion: ' + response.error, 'error');
            } else {
                // showToast('Emotion sent!', 'success'); - removed
            }
        });

        // Clear reply if there was one
        if (window.chatApp.replyToMessage) {
            window.chatApp.cancelReply();
        }

        this.hideEmotionModal();
    }

    stopEmotionCamera() {
        const video = document.getElementById('emotion-video');
        if (video && video.srcObject) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
        }
    }

    // Mood Filter Methods
    showMoodModal() {
        const modal = document.getElementById('mood-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.resetMoodModal();
        }
    }

    hideMoodModal() {
        const modal = document.getElementById('mood-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.stopMoodCamera();
        }
    }

    resetMoodModal() {
        // Reset UI elements
        document.getElementById('start-mood-camera')?.classList.remove('hidden');
        document.getElementById('capture-mood-image')?.classList.add('hidden');
        document.getElementById('mood-result')?.classList.add('hidden');
        
        // Clear previous results
        const filteredImage = document.getElementById('filtered-image');
        if (filteredImage) filteredImage.src = '';
    }

    async startMoodCamera() {
        try {
            const video = document.getElementById('mood-video');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                } 
            });
            
            video.srcObject = stream;
            
            // Update UI
            document.getElementById('start-mood-camera')?.classList.add('hidden');
            document.getElementById('capture-mood-image')?.classList.remove('hidden');
            
            showToast('Camera started! Smile for your artistic filter!', 'info');
        } catch (error) {
            console.error('Error accessing camera:', error);
            showToast('Unable to access camera. Please check permissions.', 'error');
        }
    }

    async captureMoodImage() {
        const video = document.getElementById('mood-video');
        const canvas = document.getElementById('mood-canvas');
        
        if (!video || !canvas) return;

        // Set canvas dimensions with higher resolution for better quality
        const maxWidth = 1920;  // Higher resolution for better quality
        const maxHeight = 1080;
        
        let { videoWidth, videoHeight } = video;
        
        // Scale up if video is too small for better quality
        if (videoWidth < 640) {
            const scale = 640 / videoWidth;
            videoWidth *= scale;
            videoHeight *= scale;
        }
        
        // Limit maximum size to prevent huge files
        if (videoWidth > maxWidth) {
            const scale = maxWidth / videoWidth;
            videoWidth *= scale;
            videoHeight *= scale;
        }
        
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        // Draw video frame to canvas with high quality settings
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
        
        // Convert to blob with maximum quality (95% instead of 90%)
        canvas.toBlob(async (blob) => {
            try {
                // Show loading state
                this.showProcessingState();
                // showToast('🎨 Applying MOOD effect...', 'info'); - removed
                
                // Apply MOOD filter using Oyyi API
                const filteredImageUrl = await this.applyMoodFilter(blob);
                
                this.displayMoodResult(filteredImageUrl);
                // showToast('✅ MOOD effect applied!', 'success'); - removed
            } catch (error) {
                console.error('Error applying MOOD filter:', error);
                showToast('❌ Failed to apply MOOD effect. Please try again.', 'error');
                this.hideProcessingState();
            }
        }, 'image/jpeg', 0.95);  // Increased quality from 90% to 95%
    }

    // 🎨 MOOD FILTER INTEGRATION - Using Oyyi API
    async applyMoodFilter(imageBlob) {
        try {
            console.log('🎨 Applying MOOD filter using Oyyi API...');
            // showToast('🎨 Processing MOOD effect...', 'info'); - removed

            const formData = new FormData();
            formData.append('image', imageBlob, 'mood-image.jpg');  // Input as JPG, output as PNG

            const response = await fetch('/api/mood-filter', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('chatapp_token')}`
                },
                body: formData
            });

            const result = await response.json();
            console.log('🎨 MOOD Filter API response:', result);

            if (!response.ok || !result.success) {
                throw new Error(result.message || `API Error: ${response.status}`);
            }

            if (result.filteredImage) {
                console.log('✅ MOOD effect applied successfully using Oyyi API');
                // showToast(`✅ ${result.message}`, 'success'); - removed
                return result.filteredImage;
            } else {
                throw new Error('No filtered image received from MOOD API');
            }

        } catch (error) {
            console.error('❌ MOOD filter error:', error);
            
            // Fallback to original image with notification
            showToast(`⚠️ MOOD effect failed: ${error.message}`, 'warning');
            return this.fallbackFilter(imageBlob);
        }
    }

    // 🎨 FALLBACK FILTER (if MOOD API fails)
    async fallbackFilter(imageBlob) {
        const canvas = document.getElementById('mood-canvas');
        
        // Return original image as fallback
        return canvas.toDataURL('image/jpeg', 0.8);
    }

    // 🔄 PROCESSING STATE MANAGEMENT
    showProcessingState() {
        const resultContainer = document.getElementById('mood-result');
        const captureButton = document.getElementById('capture-mood-image');
        
        if (resultContainer) {
            resultContainer.innerHTML = `
                <div class="mood-processing">
                    <i class="fas fa-magic fa-spin"></i>
                    <p>Converting to Artistic Style...</p>
                    <small>This may take a few seconds</small>
                </div>
            `;
            resultContainer.classList.remove('hidden');
        }
        
        if (captureButton) {
            captureButton.disabled = true;
            captureButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        }
    }

    hideProcessingState() {
        const captureButton = document.getElementById('capture-mood-image');
        
        if (captureButton) {
            captureButton.disabled = false;
            captureButton.innerHTML = '<i class="fas fa-palette"></i> Capture & Apply MOOD';
        }
    }

    displayMoodResult(imageUrl) {
        const resultContainer = document.getElementById('mood-result');
        
        if (resultContainer) {
            resultContainer.innerHTML = `
                <h3>🎨 MOOD Result:</h3>
                <img id="filtered-image" src="${imageUrl}" alt="MOOD Filtered Image" class="filtered-image">
                <div class="result-actions">
                    <button id="send-mood-image" class="btn btn-success">
                        <i class="fas fa-paper-plane"></i> Send MOOD
                    </button>
                    <button id="retake-mood-image" class="btn btn-secondary">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
            resultContainer.classList.remove('hidden');
        }
        
        // Hide capture button, reset it
        this.hideProcessingState();
        document.getElementById('capture-mood-image')?.classList.add('hidden');
        
        // Store image data for sending
        this.currentMoodImage = imageUrl;
        
        // Add event listeners
        document.getElementById('send-mood-image')?.addEventListener('click', () => {
            this.sendMoodMessage();
        });
        
        document.getElementById('retake-mood-image')?.addEventListener('click', () => {
            this.resetMoodCapture();
        });
    }

    resetMoodCapture() {
        const resultContainer = document.getElementById('mood-result');
        const captureButton = document.getElementById('capture-mood-image');
        
        if (resultContainer) resultContainer.classList.add('hidden');
        if (captureButton) captureButton.classList.remove('hidden');
        
        this.currentMoodImage = null;
    }

    sendMoodMessage() {
        if (!this.currentMoodImage || !window.chatApp) return;

        // Check socket connection
        if (!window.chatApp.socket || !window.chatApp.socket.connected) {
            showToast('Not connected to server. Please refresh the page.', 'error');
            return;
        }

        // Debug: Check current user
        console.log('🐛 Debug - Current user (mood):', window.chatApp.currentUser);
        console.log('🐛 Debug - Current user ID (mood):', window.chatApp.currentUser?.id);
        
        const messageData = {
            content: 'Shared a mood image',
            messageType: 'mood_image',
            imageUrl: this.currentMoodImage,
            sender: window.chatApp.currentUser.id // Add sender ID
        };
        
        console.log('🐛 Debug - Mood message data:', messageData);

        // Add receiver ID and send using unified handler - handle both id and _id formats
        const receiverId = window.chatApp.currentChatUser.id || window.chatApp.currentChatUser._id;
        messageData.receiverId = receiverId;

        // Add reply data if replying to a message
        if (window.chatApp.replyToMessage) {
            messageData.replyTo = window.chatApp.replyToMessage._id;
        }
        
        console.log('📤 Sending mood message to:', window.chatApp.currentChatUser.username, 'ID:', receiverId);
        
        window.chatApp.socket.emit('send_message', messageData, (response) => {
            if (response && !response.success) {
                showToast('Failed to send mood image: ' + response.error, 'error');
            } else {
                // showToast('Mood image sent!', 'success'); - removed
            }
        });

        // Clear reply if there was one
        if (window.chatApp.replyToMessage) {
            window.chatApp.cancelReply();
        }

        this.hideMoodModal();
    }

    stopMoodCamera() {
        const video = document.getElementById('mood-video');
        if (video && video.srcObject) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
        }
    }
}

// Initialize chat controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatController = new ChatController();
});