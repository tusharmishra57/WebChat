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
                const mockEmotion = await this.simulateEmotionDetection(blob);
                
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
        
        // Mock emotions with random selection
        const emotions = [
            { emotion: 'happy', confidence: 0.85 },
            { emotion: 'sad', confidence: 0.72 },
            { emotion: 'surprised', confidence: 0.91 },
            { emotion: 'angry', confidence: 0.68 },
            { emotion: 'neutral', confidence: 0.79 },
            { emotion: 'excited', confidence: 0.88 },
            { emotion: 'confused', confidence: 0.65 }
        ];
        
        return emotions[Math.floor(Math.random() * emotions.length)];
    }

    displayEmotionResult(emotionData) {
        const emotionText = document.getElementById('detected-emotion');
        const confidenceText = document.getElementById('emotion-confidence');
        const resultContainer = document.getElementById('emotion-result');
        
        if (emotionText) emotionText.textContent = emotionData.emotion;
        if (confidenceText) confidenceText.style.display = 'none'; // Hide confidence text
        if (resultContainer) resultContainer.classList.remove('hidden');
        
        // Hide capture button
        document.getElementById('capture-emotion')?.classList.add('hidden');
        
        // Store emotion data for sending
        this.currentEmotion = emotionData;
        
        showToast(`Emotion detected: ${emotionData.emotion}`, 'success');
    }

    sendEmotionMessage() {
        if (!this.currentEmotion || !window.chatApp) return;

        // Check socket connection
        if (!window.chatApp.socket || !window.chatApp.socket.connected) {
            showToast('Not connected to server. Please refresh the page.', 'error');
            return;
        }

        const messageData = {
            content: `Feeling ${this.currentEmotion.emotion}`,
            messageType: 'emotion',
            emotionData: this.currentEmotion
        };

        // Add receiver ID and send using unified handler - handle both id and _id formats
        const receiverId = window.chatApp.currentChatUser.id || window.chatApp.currentChatUser._id;
        messageData.receiverId = receiverId;
        
        console.log('📤 Sending emotion message to:', window.chatApp.currentChatUser.username, 'ID:', receiverId);
        
        window.chatApp.socket.emit('send_message', messageData, (response) => {
            if (response && !response.success) {
                showToast('Failed to send emotion: ' + response.error, 'error');
            } else {
                showToast('Emotion sent!', 'success');
            }
        });

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

        // Set canvas dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        // Convert to blob and send to cartoon API
        canvas.toBlob(async (blob) => {
            try {
                // Show loading state
                this.showProcessingState();
                showToast('🎨 Applying sketch effect...', 'info');
                
                // Apply sketch filter using Oyyi API
                const filteredImageUrl = await this.applySketchFilter(blob);
                
                this.displaySketchResult(filteredImageUrl);
                showToast('✅ Sketch effect applied!', 'success');
            } catch (error) {
                console.error('Error applying sketch filter:', error);
                showToast('❌ Failed to apply sketch effect. Please try again.', 'error');
                this.hideProcessingState();
            }
        }, 'image/jpeg', 0.9);
    }

    // 🎨 SKETCH FILTER INTEGRATION
    async applySketchFilter(imageBlob) {
        try {
            console.log('🎨 Applying sketch filter...');
            showToast('🎨 Processing sketch effect...', 'info');

            const formData = new FormData();
            formData.append('image', imageBlob, 'sketch-image.jpg');

            const response = await fetch('/api/mood-filter', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('chatapp_token')}`
                },
                body: formData
            });

            const result = await response.json();
            console.log('🎨 Sketch Filter API response:', result);

            if (!response.ok || !result.success) {
                throw new Error(result.message || `API Error: ${response.status}`);
            }

            if (result.filteredImage) {
                console.log('✅ Sketch effect applied successfully');
                showToast(`✅ ${result.message}`, 'success');
                return result.filteredImage;
            } else {
                throw new Error('No filtered image received from Sketch API');
            }

        } catch (error) {
            console.error('❌ Sketch filter error:', error);
            
            // Fallback to original image with notification
            showToast(`⚠️ Sketch effect failed: ${error.message}`, 'warning');
            return this.fallbackFilter(imageBlob);
        }
    }

    // 🎨 FALLBACK FILTER (if Sketch API fails)
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
            captureButton.innerHTML = '<i class="fas fa-magic"></i> Capture & Apply Sketch';
        }
    }

    displaySketchResult(imageUrl) {
        const resultContainer = document.getElementById('mood-result');
        
        if (resultContainer) {
            resultContainer.innerHTML = `
                <h3>🎨 Sketch Result:</h3>
                <img id="filtered-image" src="${imageUrl}" alt="Sketch Filtered Image" class="filtered-image">
                <div class="result-actions">
                    <button id="send-mood-image" class="btn btn-success">
                        <i class="fas fa-paper-plane"></i> Send Sketch
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

        const messageData = {
            content: 'Shared a mood image',
            messageType: 'mood_image',
            imageUrl: this.currentMoodImage
        };

        // Add receiver ID and send using unified handler - handle both id and _id formats
        const receiverId = window.chatApp.currentChatUser.id || window.chatApp.currentChatUser._id;
        messageData.receiverId = receiverId;
        
        console.log('📤 Sending mood message to:', window.chatApp.currentChatUser.username, 'ID:', receiverId);
        
        window.chatApp.socket.emit('send_message', messageData, (response) => {
            if (response && !response.success) {
                showToast('Failed to send mood image: ' + response.error, 'error');
            } else {
                showToast('Mood image sent!', 'success');
            }
        });

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