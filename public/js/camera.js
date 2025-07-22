// Camera utilities and API integration
class CameraController {
    constructor() {
        this.currentStream = null;
        this.isEmotionAPIEnabled = false;
        this.isMoodAPIEnabled = false;
        this.checkAPIAvailability();
    }

    async checkAPIAvailability() {
        // Check if APIs are configured
        // This would typically check if API keys are available
        // For now, we'll use mock implementations
        this.isEmotionAPIEnabled = false; // Set to true when you have real API
        this.isMoodAPIEnabled = false; // Set to true when you have real API
    }

    async requestCameraPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 },
                    facingMode: 'user'
                } 
            });
            
            // Stop the stream immediately, we just wanted to check permission
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('Camera permission denied:', error);
            return false;
        }
    }

    async startCamera(videoElement, options = {}) {
        try {
            const constraints = {
                video: {
                    width: { ideal: options.width || 1280, min: 640 },
                    height: { ideal: options.height || 720, min: 480 },
                    facingMode: options.facingMode || 'user'
                }
            };

            this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            videoElement.srcObject = this.currentStream;
            
            return true;
        } catch (error) {
            console.error('Error starting camera:', error);
            throw new Error('Unable to access camera. Please check permissions.');
        }
    }

    stopCamera(videoElement = null) {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
        
        if (videoElement) {
            videoElement.srcObject = null;
        }
    }

    captureFrame(videoElement, canvasElement) {
        if (!videoElement || !canvasElement) {
            throw new Error('Video or canvas element not found');
        }

        // Set canvas dimensions to match video
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;

        // Draw current video frame to canvas
        const ctx = canvasElement.getContext('2d');
        ctx.drawImage(videoElement, 0, 0);

        return canvasElement;
    }

    canvasToBlob(canvas, quality = 0.8) {
        return new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', quality);
        });
    }

    canvasToDataURL(canvas, quality = 0.8) {
        return canvas.toDataURL('image/jpeg', quality);
    }

    // Emotion Detection API Integration
    async detectEmotion(imageBlob) {
        if (this.isEmotionAPIEnabled) {
            return await this.callEmotionAPI(imageBlob);
        } else {
            return await this.mockEmotionDetection(imageBlob);
        }
    }

    async callEmotionAPI(imageBlob) {
        try {
            // This is where you would integrate with a real emotion detection API
            // Example with Microsoft Cognitive Services Face API:
            /*
            const formData = new FormData();
            formData.append('image', imageBlob);

            const response = await fetch('https://your-emotion-api-endpoint', {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': 'your-api-key',
                    'Content-Type': 'application/octet-stream'
                },
                body: imageBlob
            });

            const result = await response.json();
            return this.parseEmotionResponse(result);
            */

            // For now, return mock data
            return await this.mockEmotionDetection(imageBlob);
        } catch (error) {
            console.error('Emotion API error:', error);
            throw new Error('Failed to detect emotion');
        }
    }

    async mockEmotionDetection(imageBlob) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const emotions = [
            { emotion: 'happy', confidence: 0.85 + Math.random() * 0.1 },
            { emotion: 'sad', confidence: 0.72 + Math.random() * 0.15 },
            { emotion: 'surprised', confidence: 0.91 + Math.random() * 0.08 },
            { emotion: 'angry', confidence: 0.68 + Math.random() * 0.2 },
            { emotion: 'neutral', confidence: 0.79 + Math.random() * 0.1 },
            { emotion: 'excited', confidence: 0.88 + Math.random() * 0.1 },
            { emotion: 'confused', confidence: 0.65 + Math.random() * 0.2 },
            { emotion: 'focused', confidence: 0.82 + Math.random() * 0.15 },
            { emotion: 'relaxed', confidence: 0.76 + Math.random() * 0.12 }
        ];

        const selectedEmotion = emotions[Math.floor(Math.random() * emotions.length)];
        
        // Ensure confidence doesn't exceed 1.0
        selectedEmotion.confidence = Math.min(selectedEmotion.confidence, 0.99);

        return selectedEmotion;
    }

    parseEmotionResponse(apiResponse) {
        // Parse the response from your emotion detection API
        // This will depend on the specific API you're using
        
        // Example for Microsoft Face API:
        /*
        if (apiResponse && apiResponse.length > 0) {
            const face = apiResponse[0];
            const emotions = face.faceAttributes.emotion;
            
            // Find the emotion with highest confidence
            let maxEmotion = 'neutral';
            let maxConfidence = 0;
            
            for (const [emotion, confidence] of Object.entries(emotions)) {
                if (confidence > maxConfidence) {
                    maxConfidence = confidence;
                    maxEmotion = emotion;
                }
            }
            
            return { emotion: maxEmotion, confidence: maxConfidence };
        }
        */
        
        return { emotion: 'neutral', confidence: 0.5 };
    }

    // Mood Filter API Integration
    async applyMoodFilter(imageBlob, filterType = 'ghibli') {
        if (this.isMoodAPIEnabled) {
            return await this.callMoodFilterAPI(imageBlob, filterType);
        } else {
            return await this.mockMoodFilter(imageBlob, filterType);
        }
    }

    async callMoodFilterAPI(imageBlob, filterType) {
        try {
            // This is where you would integrate with a real image filter API
            // Example with a hypothetical API:
            /*
            const formData = new FormData();
            formData.append('image', imageBlob);
            formData.append('filter', filterType);

            const response = await fetch('https://your-mood-filter-api-endpoint', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer your-api-key'
                },
                body: formData
            });

            const result = await response.blob();
            return URL.createObjectURL(result);
            */

            // For now, return mock filtered image
            return await this.mockMoodFilter(imageBlob, filterType);
        } catch (error) {
            console.error('Mood filter API error:', error);
            throw new Error('Failed to apply mood filter');
        }
    }

    async mockMoodFilter(imageBlob, filterType) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Create a canvas to apply mock filter
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Create image from blob
        const img = new Image();
        const imageUrl = URL.createObjectURL(imageBlob);
        
        return new Promise((resolve) => {
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Draw original image
                ctx.drawImage(img, 0, 0);
                
                // Apply filter based on type
                this.applyCanvasFilter(ctx, canvas, filterType);
                
                // Clean up
                URL.revokeObjectURL(imageUrl);
                
                // Return filtered image as data URL
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            
            img.src = imageUrl;
        });
    }

    applyCanvasFilter(ctx, canvas, filterType) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        switch (filterType) {
            case 'ghibli':
                this.applyGhibliFilter(data);
                break;
            case 'vintage':
                this.applyVintageFilter(data);
                break;
            case 'dreamy':
                this.applyDreamyFilter(data);
                break;
            case 'warm':
                this.applyWarmFilter(data);
                break;
            default:
                this.applyGhibliFilter(data);
        }

        ctx.putImageData(imageData, 0, 0);
    }

    applyGhibliFilter(data) {
        // Apply a Ghibli-style filter (warm, soft, slightly desaturated)
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Increase warmth
            data[i] = Math.min(255, r * 1.1 + 10);
            data[i + 1] = Math.min(255, g * 1.05 + 5);
            data[i + 2] = Math.min(255, b * 0.9);

            // Slight sepia effect
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = Math.min(255, gray * 1.2 + 40);
            data[i + 1] = Math.min(255, gray * 1.1 + 20);
            data[i + 2] = Math.min(255, gray * 0.9 + 10);
        }
    }

    applyVintageFilter(data) {
        // Apply vintage/retro filter
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Sepia effect
            data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
            data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
            data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));

            // Reduce contrast slightly
            data[i] = data[i] * 0.9 + 25;
            data[i + 1] = data[i + 1] * 0.9 + 25;
            data[i + 2] = data[i + 2] * 0.9 + 25;
        }
    }

    applyDreamyFilter(data) {
        // Apply dreamy/soft filter
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Soften and add slight pink tint
            data[i] = Math.min(255, r * 1.05 + 15);
            data[i + 1] = Math.min(255, g * 0.98 + 10);
            data[i + 2] = Math.min(255, b * 1.02 + 20);

            // Reduce contrast for dreamy effect
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = (data[i] + avg) / 2;
            data[i + 1] = (data[i + 1] + avg) / 2;
            data[i + 2] = (data[i + 2] + avg) / 2;
        }
    }

    applyWarmFilter(data) {
        // Apply warm filter
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Increase reds and yellows, decrease blues
            data[i] = Math.min(255, r * 1.15);
            data[i + 1] = Math.min(255, g * 1.1);
            data[i + 2] = Math.min(255, b * 0.85);
        }
    }

    // Utility methods
    async resizeImage(imageBlob, maxWidth = 800, maxHeight = 600) {
        return new Promise((resolve) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw resized image
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(resolve, 'image/jpeg', 0.8);
            };
            
            img.src = URL.createObjectURL(imageBlob);
        });
    }

    isWebRTCSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    isCameraAvailable() {
        return navigator.mediaDevices.enumerateDevices()
            .then(devices => devices.some(device => device.kind === 'videoinput'))
            .catch(() => false);
    }
}

// Initialize camera controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cameraController = new CameraController();
});