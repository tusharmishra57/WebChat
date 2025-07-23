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
        // Clean up existing socket
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }

        console.log('🔌 Initializing Socket.IO connection...');
        
        this.socket = io({
            transports: ['polling', 'websocket'],
            upgrade: true,
            rememberUpgrade: false,
            timeout: 20000,
            forceNew: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 10,
            randomizationFactor: 0.3
        });
        
        // Connection established
        this.socket.on('connect', () => {
            console.log('✅ Socket connected:', this.socket.id);
            console.log('🚀 Transport:', this.socket.io.engine.transport.name);
            this.updateConnectionStatus('connected');
            
            // Auto-join if user is logged in
            if (this.currentUser) {
                console.log('👤 Auto-joining user:', this.currentUser.username);
                this.socket.emit('user_join', {
                    userId: this.currentUser.id,
                    username: this.currentUser.username
                });
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ Disconnected from server:', reason);
            console.log('Disconnect reason details:', reason);
            this.updateConnectionStatus('disconnected');
            
            // Only show toast for unexpected disconnections
            if (reason !== 'io client disconnect') {
                showToast('Connection lost. Reconnecting...', 'error');
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error);
            this.updateConnectionStatus('disconnected');
            showToast('Connection failed. Please refresh the page.', 'error');
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('✅ Reconnected to server after', attemptNumber, 'attempts');
            this.updateConnectionStatus('connected');
            showToast('Reconnected successfully!', 'success');
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
            console.log('📡 Received online users via Socket.IO:', users);
            this.updateOnlineUsers(users);
        });

        // Join success/error
        this.socket.on('join_success', (data) => {
            console.log('✅ Successfully joined chat:', data);
            showToast('Connected to chat!', 'success');
        });

        this.socket.on('join_error', (error) => {
            console.error('❌ Join error:', error);
            showToast('Failed to join chat: ' + error.error, 'error');
        });

        // Message received from another user
        this.socket.on('message_received', (message) => {
            console.log('📨 Message received:', message);
            this.handleIncomingMessage(message);
        });

        // Message sent confirmation
        this.socket.on('message_sent', (message) => {
            console.log('✅ Message sent:', message);
            this.handleMessageSent(message);
        });

        // Message error
        this.socket.on('message_error', (error) => {
            console.error('❌ Message error:', error);
            showToast('Message failed: ' + error.error, 'error');
        });

        // Typing indicators
        this.socket.on('user_typing', (data) => {
            console.log('⌨️ User typing:', data);
            this.handleUserTyping(data);
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

        // Emoji functionality
        this.setupEmojiPicker();

        // Modal close on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideAllModals();
            }
        });

        // Escape key to close modals and emoji picker
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllModals();
                if (this.isEmojiPickerOpen) {
                    this.hideEmojiPicker();
                }
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
            // Handle both user.id and user._id formats
            const userId = user.id || user._id;
            console.log('📱 Starting chat with user:', user.username, 'ID:', userId);
            this.loadChatMessages(userId);
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
                console.log('🌐 Received online users via HTTP:', users);
                this.updateOnlineUsers(users);
            }
        } catch (error) {
            console.error('Error loading online users:', error);
        }
    }

    updateOnlineUsers(users) {
        console.log('👥 Updating online users:', users);
        const container = document.getElementById('online-users');
        if (!container) return;

        container.innerHTML = '';

        if (users.length === 0) {
            console.log('👥 No users to display');
            container.innerHTML = `
                <div class="no-users">
                    <p>No other users online right now</p>
                </div>
            `;
            return;
        }

        users.forEach(user => {
            console.log('👤 Creating card for user:', user);
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
                console.log('🖱️ User card clicked:', user);
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
        console.log('🚀 Starting chat with user:', user);
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
            if (!receiverId || receiverId === 'undefined') {
                console.error('Invalid receiverId:', receiverId);
                return;
            }

            const token = localStorage.getItem('chatapp_token');
            const response = await fetch(`/api/messages/${receiverId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const messages = await response.json();
                this.displayMessages(messages);
            } else {
                console.error('Failed to load chat messages:', response.status, response.statusText);
                const errorData = await response.text();
                console.error('Error details:', errorData);
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
            } else {
                console.error('Failed to load self messages:', response.status, response.statusText);
                const errorData = await response.text();
                console.error('Error details:', errorData);
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
            // 🎨 Apply different colors based on emotion
            const emotionClass = `emotion-${message.emotionData.emotion.toLowerCase()}`;
            
            // 🎭 Emoji mapping for each emotion
            let emotionEmoji = '😐'; // Default neutral
            if (message.emotionData.emotion === 'Happy') emotionEmoji = '😊';
            else if (message.emotionData.emotion === 'Angry') emotionEmoji = '😡';
            
            messageContent = `
                <div class="message-content emotion-message">
                    <div class="emotion-display">
                        <span class="emotion-text ${emotionClass}">
                            ${message.emotionData.emotion} ${emotionEmoji}
                        </span>
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
            // Check if message contains only emojis
            const emojiOnlyClass = this.isEmojiOnly(message.content) ? 'emoji-only' : '';
            
            messageContent = `
                <div class="message-content">
                    <p class="message-text ${emojiOnlyClass}">${escapeHtml(message.content)}</p>
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
            showToast('Not connected to server. Please refresh the page.', 'error');
            return;
        }

        const messageData = {
            content,
            messageType: 'text'
        };

        try {
            // Add receiver ID to message data - handle both id and _id formats
            const receiverId = this.currentChatUser.id || this.currentChatUser._id;
            messageData.receiverId = receiverId;
            
            console.log('📤 Sending message to:', this.currentChatUser.username, 'ID:', receiverId);
            console.log('📤 Message data:', messageData);
            
            // Use unified message handler
            this.socket.emit('send_message', messageData, (response) => {
                if (response && !response.success) {
                    console.error('❌ Message send failed:', response.error);
                    showToast('Failed to send: ' + response.error, 'error');
                } else {
                    console.log('✅ Message sent successfully:', response);
                }
            });

            // Clear input and stop typing
            input.value = '';
            this.stopTyping();
            
        } catch (error) {
            console.error('❌ Send message error:', error);
            showToast('Failed to send message. Please try again.', 'error');
        }
    }

    // Handle incoming messages from other users
    handleIncomingMessage(message) {
        console.log('📥 Processing incoming message:', message);
        
        if (this.currentChatUser) {
            const senderId = message.sender._id || message.sender;
            
            // Show message if it's from the current chat user
            if (senderId === this.currentChatUser.id) {
                this.addMessageToChat(message);
                this.scrollToBottom();
                this.playNotificationSound();
            }
        }
        
        // Show toast notification
        const senderName = message.sender.username || 'Someone';
        showToast(`New message from ${senderName}`, 'info');
    }

    // Handle sent message confirmation
    handleMessageSent(message) {
        console.log('📤 Processing sent message confirmation:', message);
        
        // Always display sent messages in current chat
        if (this.currentChatUser) {
            this.addMessageToChat(message);
            this.scrollToBottom();
        }
    }

    // Play notification sound
    playNotificationSound() {
        try {
            // Simple beep sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.1;
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            // Ignore audio errors
        }
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

    // 😊 EMOJI PICKER FUNCTIONALITY
    setupEmojiPicker() {
        const emojiBtn = document.getElementById('emoji-btn');
        const emojiPicker = document.getElementById('emoji-picker');
        const emojiGrid = document.getElementById('emoji-grid');

        if (!emojiBtn || !emojiPicker || !emojiGrid) return;

        // 🎭 EMOJI DATA - WhatsApp/Telegram Style Categories
        this.emojiData = {
            recent: [], // Will be populated from localStorage
            smileys: [
                '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇',
                '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '😋', '😛', '😜', '🤪', '😝',
                '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄',
                '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵'
            ],
            animals: [
                '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷',
                '🐵', '🐸', '🐙', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🕷️', '🦂',
                '🐢', '🐍', '🦎', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳',
                '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦏', '🦛', '🐪', '🐫'
            ],
            food: [
                '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥',
                '🥝', '🍅', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🥒', '🥬', '🥦', '🧄', '🧅',
                '🍞', '🥐', '🥖', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔',
                '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '☕'
            ],
            activity: [
                '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🏒', '🏑',
                '🥍', '🏏', '🥅', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️',
                '🥌', '🎿', '⛷️', '🏂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🏌️', '🏇', '🧘',
                '🏄', '🏊', '🚴', '🚵', '🧗', '🤹', '🎪', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧'
            ],
            travel: [
                '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨',
                '🏪', '🏫', '🏩', '💒', '🏛️', '⛪', '🕌', '🕍', '🛕', '🗾', '🎑', '🏞️', '🌅',
                '🌄', '🌠', '🎇', '🎆', '🌇', '🌆', '🏙️', '🌃', '🌌', '🌉', '🌁', '⛄', '❄️',
                '☃️', '🌊', '💧', '🔥', '💥', '⭐', '🌟', '✨', '⚡', '☄️', '💫', '🌙', '☀️'
            ],
            objects: [
                '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾',
                '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠',
                '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⏳', '⌛', '📡',
                '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷'
            ],
            symbols: [
                '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞',
                '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯',
                '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
                '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸'
            ]
        };

        this.recentEmojis = JSON.parse(localStorage.getItem('chatapp_recent_emojis') || '[]');
        this.emojiData.recent = this.recentEmojis.slice(0, 32); // Show last 32 recent emojis
        
        this.currentEmojiCategory = 'recent';
        this.isEmojiPickerOpen = false;

        // Toggle emoji picker
        emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleEmojiPicker();
        });

        // Category buttons
        const categoryButtons = document.querySelectorAll('.emoji-category');
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const category = btn.dataset.category;
                this.switchEmojiCategory(category);
            });
        });

        // Close button
        const closeEmojiBtn = document.getElementById('close-emoji-picker');
        if (closeEmojiBtn) {
            closeEmojiBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hideEmojiPicker();
            });
        }

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.isEmojiPickerOpen && !emojiPicker.contains(e.target) && !emojiBtn.contains(e.target)) {
                this.hideEmojiPicker();
            }
        });

        // Load initial emojis (recent or smileys if no recent)
        const initialCategory = this.emojiData.recent.length > 0 ? 'recent' : 'smileys';
        this.switchEmojiCategory(initialCategory);
    }

    toggleEmojiPicker() {
        const emojiPicker = document.getElementById('emoji-picker');
        const emojiBtn = document.getElementById('emoji-btn');
        
        if (this.isEmojiPickerOpen) {
            this.hideEmojiPicker();
        } else {
            this.showEmojiPicker();
        }
    }

    showEmojiPicker() {
        const emojiPicker = document.getElementById('emoji-picker');
        const emojiBtn = document.getElementById('emoji-btn');
        
        emojiPicker.classList.remove('hidden');
        emojiBtn.classList.add('active');
        this.isEmojiPickerOpen = true;
    }

    hideEmojiPicker() {
        const emojiPicker = document.getElementById('emoji-picker');
        const emojiBtn = document.getElementById('emoji-btn');
        
        emojiPicker.classList.add('hidden');
        emojiBtn.classList.remove('active');
        this.isEmojiPickerOpen = false;
    }

    switchEmojiCategory(category) {
        // Update active category button
        document.querySelectorAll('.emoji-category').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        this.currentEmojiCategory = category;
        this.loadEmojis(category);
    }

    loadEmojis(category) {
        const emojiGrid = document.getElementById('emoji-grid');
        let emojis = this.emojiData[category] || [];

        emojiGrid.innerHTML = '';

        // Special handling for recent emojis
        if (category === 'recent' && emojis.length === 0) {
            emojiGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: rgba(0,0,0,0.5);">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">🤔</div>
                    <div>No recent emojis yet!</div>
                    <div style="font-size: 0.8rem; margin-top: 0.5rem;">Start using emojis to see them here</div>
                </div>
            `;
            return;
        }

        emojis.forEach(emoji => {
            const emojiBtn = document.createElement('button');
            emojiBtn.className = 'emoji-item';
            emojiBtn.textContent = emoji;
            emojiBtn.title = emoji;
            
            emojiBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.insertEmoji(emoji);
                
                // Visual feedback - brief highlight
                emojiBtn.style.transform = 'scale(1.3)';
                emojiBtn.style.background = 'rgba(102, 126, 234, 0.3)';
                setTimeout(() => {
                    emojiBtn.style.transform = '';
                    emojiBtn.style.background = '';
                }, 150);
            });

            emojiGrid.appendChild(emojiBtn);
        });
    }

    insertEmoji(emoji) {
        const messageInput = document.getElementById('message-input');
        if (!messageInput) return;

        const start = messageInput.selectionStart;
        const end = messageInput.selectionEnd;
        const text = messageInput.value;

        // Insert emoji at cursor position
        const newText = text.substring(0, start) + emoji + text.substring(end);
        messageInput.value = newText;

        // Set cursor position after emoji
        const newCursorPos = start + emoji.length;
        messageInput.setSelectionRange(newCursorPos, newCursorPos);
        messageInput.focus();

        // 💾 Add to recent emojis (WhatsApp style)
        this.addToRecentEmojis(emoji);

        // Keep emoji picker open for multiple selections (like WhatsApp)
        // Only hide if user clicks outside or presses escape
        
        console.log('🎯 Emoji inserted:', emoji);
    }

    // 🤔 CHECK IF MESSAGE CONTAINS ONLY EMOJIS
    isEmojiOnly(text) {
        if (!text || text.trim().length === 0) return false;
        
        // Remove all whitespace and check if remaining text is only emojis
        const cleanText = text.replace(/\s/g, '');
        
        // Simple emoji detection - this will match most common emojis
        const emojiRegex = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]+$/u;
        
        // Also check for length - if it's just a few characters and no letters/numbers, likely emojis
        const hasLettersOrNumbers = /[a-zA-Z0-9]/.test(cleanText);
        const isShort = cleanText.length <= 10; // Up to ~5 emojis
        
        return (emojiRegex.test(cleanText) || (!hasLettersOrNumbers && isShort));
    }

    // 🕒 RECENT EMOJIS MANAGEMENT
    addToRecentEmojis(emoji) {
        // Remove emoji if it already exists
        this.recentEmojis = this.recentEmojis.filter(e => e !== emoji);
        
        // Add to beginning
        this.recentEmojis.unshift(emoji);
        
        // Keep only last 32 emojis
        this.recentEmojis = this.recentEmojis.slice(0, 32);
        
        // Update data and localStorage
        this.emojiData.recent = this.recentEmojis;
        localStorage.setItem('chatapp_recent_emojis', JSON.stringify(this.recentEmojis));
        
        // If currently viewing recent category, refresh it
        if (this.currentEmojiCategory === 'recent') {
            this.loadEmojis('recent');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ChatApp();
});