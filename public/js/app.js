// Main Application Controller
class ChatApp {
    constructor() {
        this.socket = null;
        this.currentUser = null;
        this.currentChatUser = null;
        this.isTyping = false;
        this.typingTimeout = null;
        
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.setupEventListeners();
        this.hideLoadingScreen();
    }

    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 300);
            }
        }, 1000);
    }

    updateConnectionStatus(status) {
        const connectionStatus = document.getElementById('connection-status');
        const connectionText = document.getElementById('connection-text');
        
        if (!connectionStatus || !connectionText) return;
        
        connectionStatus.className = `connection-status ${status}`;
        
        switch (status) {
            case 'connected':
                connectionText.textContent = 'Connected';
                break;
            case 'disconnected':
                connectionText.textContent = 'Disconnected';
                break;
            default:
                connectionText.textContent = 'Connecting...';
        }
    }

    checkAuthStatus() {
        const token = localStorage.getItem('chatapp_token');
        const userData = localStorage.getItem('chatapp_user');

        if (token && userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.initializeSocket();
                this.showHomePage();
                this.loadUserProfile();
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.logout();
            }
        } else {
            this.showLoginPage();
        }
    }

    initializeSocket() {
        this.socket = io({
            transports: ['websocket', 'polling'],
            upgrade: true,
            rememberUpgrade: true,
            timeout: 20000,
            forceNew: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            maxReconnectionAttempts: 5
        });
        
        this.socket.on('connect', () => {
            console.log('✅ Connected to server');
            this.updateConnectionStatus('connected');
            if (this.currentUser) {
                this.socket.emit('user_join', {
                    userId: this.currentUser.id,
                    username: this.currentUser.username
                });
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ Disconnected from server:', reason);
            this.updateConnectionStatus('disconnected');
            this.showToast('Connection lost. Reconnecting...', 'error');
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error);
            this.updateConnectionStatus('disconnected');
            this.showToast('Connection failed. Please refresh the page.', 'error');
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('✅ Reconnected to server after', attemptNumber, 'attempts');
            this.updateConnectionStatus('connected');
            this.showToast('Reconnected successfully!', 'success');
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('❌ Reconnection failed:', error);
            this.updateConnectionStatus('disconnected');
        });

        this.socket.on('user_online', (userData) => {
            this.handleUserOnline(userData);
        });

        this.socket.on('user_offline', (userData) => {
            this.handleUserOffline(userData);
        });

        this.socket.on('online_users', (users) => {
            this.updateOnlineUsers(users);
        });

        this.socket.on('new_message', (message) => {
            this.handleNewMessage(message);
        });

        this.socket.on('message_sent', (message) => {
            this.handleMessageSent(message);
        });

        this.socket.on('user_typing', (data) => {
            this.handleUserTyping(data);
        });

        this.socket.on('message_error', (error) => {
            showToast('Failed to send message', 'error');
        });
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('back-to-home')?.addEventListener('click', () => {
            this.showHomePage();
        });

        // Profile modal
        document.getElementById('profile-btn')?.addEventListener('click', () => {
            this.showProfileModal();
        });

        document.getElementById('close-profile-modal')?.addEventListener('click', () => {
            this.hideProfileModal();
        });

        // Talk to yourself
        document.getElementById('talk-to-self-btn')?.addEventListener('click', () => {
            this.startSelfChat();
        });

        // Profile form
        document.getElementById('profile-form')?.addEventListener('submit', (e) => {
            this.handleProfileUpdate(e);
        });

        document.getElementById('change-picture-btn')?.addEventListener('click', () => {
            document.getElementById('profile-picture-input').click();
        });

        document.getElementById('profile-picture-input')?.addEventListener('change', (e) => {
            this.handleProfilePictureChange(e);
        });

        // Logout
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.logout();
        });

        // Message input
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });

            messageInput.addEventListener('input', () => {
                this.handleTyping();
            });
        }

        document.getElementById('send-btn')?.addEventListener('click', () => {
            this.sendMessage();
        });

        // Modal close on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideAllModals();
            }
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllModals();
            }
        });
    }

    showLoginPage() {
        this.hideAllPages();
        document.getElementById('login-page').classList.remove('hidden');
    }

    showHomePage() {
        this.hideAllPages();
        document.getElementById('home-page').classList.remove('hidden');
        this.loadOnlineUsers();
        this.updateUserDisplay();
    }

    showChatPage(user = null) {
        this.hideAllPages();
        document.getElementById('chat-page').classList.remove('hidden');
        
        if (user) {
            this.currentChatUser = user;
            this.updateChatHeader(user);
            this.loadChatMessages(user.id);
        } else {
            // Self chat
            this.currentChatUser = this.currentUser;
            this.updateChatHeader(this.currentUser, true);
            this.loadSelfMessages();
        }
    }

    hideAllPages() {
        document.querySelectorAll('.auth-page, .main-page').forEach(page => {
            page.classList.add('hidden');
        });
    }

    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    updateUserDisplay() {
        if (this.currentUser) {
            const userNameElement = document.getElementById('user-name');
            const userAvatarElement = document.getElementById('user-avatar');
            
            if (userNameElement) userNameElement.textContent = this.currentUser.username;
            if (userAvatarElement) userAvatarElement.src = this.currentUser.profilePicture || '/images/default-avatar.png';
        }
    }

    async loadOnlineUsers() {
        try {
            const token = localStorage.getItem('chatapp_token');
            const response = await fetch('/api/users/online', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const users = await response.json();
                this.updateOnlineUsers(users);
            }
        } catch (error) {
            console.error('Error loading online users:', error);
        }
    }

    updateOnlineUsers(users) {
        const container = document.getElementById('online-users');
        if (!container) return;

        container.innerHTML = '';

        if (users.length === 0) {
            container.innerHTML = `
                <div class="no-users">
                    <p>No other users online right now</p>
                </div>
            `;
            return;
        }

        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = `
                <img src="${user.profilePicture || '/images/default-avatar.png'}" alt="${user.username}">
                <div class="user-info">
                    <h3>${user.username}</h3>
                    <span class="user-status">Online</span>
                </div>
            `;

            userCard.addEventListener('click', () => {
                this.startChat(user);
            });

            container.appendChild(userCard);
        });
    }

    handleUserOnline(userData) {
        // Add user to online list if not already there
        this.loadOnlineUsers();
        showToast(`${userData.username} came online`, 'info');
    }

    handleUserOffline(userData) {
        // Remove user from online list
        this.loadOnlineUsers();
        showToast(`${userData.username} went offline`, 'info');
    }

    startChat(user) {
        this.showChatPage(user);
    }

    startSelfChat() {
        this.showChatPage();
    }

    updateChatHeader(user, isSelf = false) {
        const chatUserName = document.getElementById('chat-user-name');
        const chatUserAvatar = document.getElementById('chat-user-avatar');
        const chatUserStatus = document.getElementById('chat-user-status');

        if (chatUserName) {
            chatUserName.textContent = isSelf ? 'Talk to Yourself' : user.username;
        }
        
        if (chatUserAvatar) {
            chatUserAvatar.src = user.profilePicture || '/images/default-avatar.png';
        }
        
        if (chatUserStatus) {
            chatUserStatus.textContent = isSelf ? 'Personal Space' : 'Online';
        }
    }

    async loadChatMessages(receiverId) {
        try {
            const token = localStorage.getItem('chatapp_token');
            const response = await fetch(`/api/messages/${receiverId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const messages = await response.json();
                this.displayMessages(messages);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    async loadSelfMessages() {
        try {
            const token = localStorage.getItem('chatapp_token');
            const response = await fetch('/api/messages/self', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const messages = await response.json();
                this.displayMessages(messages);
            }
        } catch (error) {
            console.error('Error loading self messages:', error);
        }
    }

    displayMessages(messages) {
        const container = document.getElementById('messages-container');
        if (!container) return;

        container.innerHTML = '';

        messages.forEach(message => {
            this.addMessageToChat(message);
        });

        this.scrollToBottom();
    }

    addMessageToChat(message) {
        const container = document.getElementById('messages-container');
        if (!container) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender._id === this.currentUser.id ? 'own' : ''}`;

        let messageContent = '';

        if (message.messageType === 'emotion') {
            messageContent = `
                <div class="message-content emotion-message">
                    <div class="emotion-display">
                        <span class="emotion-text">${message.emotionData.emotion}</span>
                        <span class="confidence-text">${Math.round(message.emotionData.confidence * 100)}% confidence</span>
                    </div>
                    <div class="message-time">${formatTime(message.timestamp)}</div>
                </div>
            `;
        } else if (message.messageType === 'mood_image') {
            messageContent = `
                <div class="message-content">
                    <img src="${message.imageUrl}" alt="Mood Image" class="mood-image">
                    <p class="message-text">${message.content}</p>
                    <div class="message-time">${formatTime(message.timestamp)}</div>
                </div>
            `;
        } else {
            messageContent = `
                <div class="message-content">
                    <p class="message-text">${escapeHtml(message.content)}</p>
                    <div class="message-time">${formatTime(message.timestamp)}</div>
                </div>
            `;
        }

        messageElement.innerHTML = `
            <img src="${message.sender.profilePicture || '/images/default-avatar.png'}" alt="${message.sender.username}">
            ${messageContent}
        `;

        container.appendChild(messageElement);
    }

    sendMessage() {
        const input = document.getElementById('message-input');
        const content = input.value.trim();

        if (!content) return;

        // Check socket connection
        if (!this.socket || !this.socket.connected) {
            this.showToast('Not connected to server. Please refresh the page.', 'error');
            return;
        }

        const messageData = {
            content,
            messageType: 'text'
        };

        try {
            if (this.currentChatUser.id === this.currentUser.id) {
                // Self message
                this.socket.emit('self_message', messageData, (response) => {
                    if (response && response.error) {
                        this.showToast('Failed to send message: ' + response.error, 'error');
                    }
                });
            } else {
                // Private message
                messageData.receiverId = this.currentChatUser.id;
                this.socket.emit('private_message', messageData, (response) => {
                    if (response && response.error) {
                        this.showToast('Failed to send message: ' + response.error, 'error');
                    }
                });
            }

            input.value = '';
            this.stopTyping();
        } catch (error) {
            console.error('Error sending message:', error);
            this.showToast('Failed to send message. Please try again.', 'error');
        }
    }

    handleNewMessage(message) {
        // Only add message if it's for the current chat
        if (this.currentChatUser) {
            const isRelevantMessage = 
                (message.sender._id === this.currentChatUser.id && message.receiver._id === this.currentUser.id) ||
                (message.sender._id === this.currentUser.id && message.receiver._id === this.currentChatUser.id) ||
                (message.sender._id === this.currentUser.id && message.receiver._id === this.currentUser.id);

            if (isRelevantMessage) {
                this.addMessageToChat(message);
                this.scrollToBottom();
            }
        }

        // Show notification if not in chat or different chat
        if (!this.currentChatUser || message.sender._id !== this.currentChatUser.id) {
            showToast(`New message from ${message.sender.username}`, 'info');
        }
    }

    handleMessageSent(message) {
        this.addMessageToChat(message);
        this.scrollToBottom();
    }

    handleTyping() {
        if (!this.isTyping && this.currentChatUser && this.currentChatUser.id !== this.currentUser.id) {
            this.isTyping = true;
            this.socket.emit('typing', {
                receiverId: this.currentChatUser.id,
                isTyping: true
            });
        }

        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.stopTyping();
        }, 1000);
    }

    stopTyping() {
        if (this.isTyping && this.currentChatUser && this.currentChatUser.id !== this.currentUser.id) {
            this.isTyping = false;
            this.socket.emit('typing', {
                receiverId: this.currentChatUser.id,
                isTyping: false
            });
        }
    }

    handleUserTyping(data) {
        const indicator = document.getElementById('typing-indicator');
        if (!indicator) return;

        if (data.isTyping && data.userId === this.currentChatUser?.id) {
            indicator.innerHTML = `<span>${data.username}</span> is typing...`;
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    }

    scrollToBottom() {
        const container = document.getElementById('messages-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    showProfileModal() {
        const modal = document.getElementById('profile-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.loadUserProfile();
        }
    }

    hideProfileModal() {
        const modal = document.getElementById('profile-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    async loadUserProfile() {
        try {
            const token = localStorage.getItem('chatapp_token');
            const response = await fetch('/api/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const user = await response.json();
                this.currentUser = user;
                
                // Update localStorage
                localStorage.setItem('chatapp_user', JSON.stringify(user));
                
                // Update UI
                this.updateUserDisplay();
                this.updateProfileForm(user);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    updateProfileForm(user) {
        const usernameInput = document.getElementById('profile-username');
        const emailInput = document.getElementById('profile-email');
        const picturePreview = document.getElementById('profile-picture-preview');

        if (usernameInput) usernameInput.value = user.username || '';
        if (emailInput) emailInput.value = user.email || '';
        if (picturePreview) picturePreview.src = user.profilePicture || '/images/default-avatar.png';
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        
        const username = document.getElementById('profile-username').value.trim();
        
        if (!username) {
            showToast('Username is required', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('chatapp_token');
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username })
            });

            if (response.ok) {
                const user = await response.json();
                this.currentUser = user;
                localStorage.setItem('chatapp_user', JSON.stringify(user));
                this.updateUserDisplay();
                showToast('Profile updated successfully', 'success');
            } else {
                const error = await response.json();
                showToast(error.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast('Failed to update profile', 'error');
        }
    }

    async handleProfilePictureChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file', 'error');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showToast('Image size should be less than 5MB', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('profilePicture', file);

        try {
            const token = localStorage.getItem('chatapp_token');
            const response = await fetch('/api/profile/picture', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const user = await response.json();
                this.currentUser = user;
                localStorage.setItem('chatapp_user', JSON.stringify(user));
                this.updateUserDisplay();
                this.updateProfileForm(user);
                showToast('Profile picture updated successfully', 'success');
            } else {
                const error = await response.json();
                showToast(error.message || 'Failed to update profile picture', 'error');
            }
        } catch (error) {
            console.error('Error updating profile picture:', error);
            showToast('Failed to update profile picture', 'error');
        }
    }

    async logout() {
        try {
            const token = localStorage.getItem('chatapp_token');
            if (token) {
                await fetch('/api/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error('Error during logout:', error);
        }

        // Clear local storage
        localStorage.removeItem('chatapp_token');
        localStorage.removeItem('chatapp_user');

        // Disconnect socket
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        // Reset state
        this.currentUser = null;
        this.currentChatUser = null;

        // Show login page
        this.showLoginPage();
        showToast('Logged out successfully', 'success');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ChatApp();
});