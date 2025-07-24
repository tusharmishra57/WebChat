// Main Application Controller
class ChatApp {
    constructor() {
        this.socket = null;
        this.currentUser = null;
        this.currentChatUser = null;
        this.isTyping = false;
        this.typingTimeout = null;
        this.isLoggingOut = false;
        this.replyToMessage = null;
        this.messageCache = new Map(); // Store messages for reply functionality
        
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
            
            // Don't show errors or update UI if we're logging out
            if (this.isLoggingOut) {
                return;
            }
            
            this.updateConnectionStatus('disconnected');
            
            // Only show toast for unexpected disconnections
            if (reason !== 'io client disconnect') {
                showToast('Connection lost. Reconnecting...', 'error');
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error);
            
            // Don't show errors if we're logging out
            if (this.isLoggingOut) {
                return;
            }
            
            this.updateConnectionStatus('disconnected');
            showToast('Connection failed. Please refresh the page.', 'error');
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('✅ Reconnected to server after', attemptNumber, 'attempts');
            
            // Don't update UI if we're logging out
            if (this.isLoggingOut) {
                return;
            }
            
            this.updateConnectionStatus('connected');
            showToast('Reconnected successfully!', 'success');
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('❌ Reconnection failed:', error);
            
            // Don't update UI if we're logging out
            if (this.isLoggingOut) {
                return;
            }
            
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

        // Message status updates
        this.socket.on('message_delivered', (data) => {
            console.log('📨 Message delivered:', data);
            this.updateMessageStatus(data.messageId, 'delivered');
        });

        this.socket.on('message_seen', (data) => {
            console.log('👁️ Message seen:', data);
            this.updateMessageStatus(data.messageId, 'seen');
        });

        this.socket.on('messages_seen', (data) => {
            console.log('👁️ Messages seen:', data);
            this.handleMessagesSeen(data);
        });

        // Message reaction
        this.socket.on('messageReaction', (data) => {
            console.log('😊 Message reaction:', data);
            this.updateMessageReactions(data.messageId, data.reactions);
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

        // Direct logout without confirmation
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

        // New messages indicator
        document.getElementById('new-messages-indicator')?.addEventListener('click', () => {
            this.scrollToBottom(true, true);
            this.hideNewMessagesIndicator();
        });

        // Emoji functionality - handled by modern emoji picker
        // this.setupEmojiPicker();

        // Modal close on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideAllModals();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllModals();
                if (this.isEmojiPickerOpen) {
                    this.hideEmojiPicker();
                }
                // Cancel reply if active
                if (this.replyToMessage) {
                    this.cancelReply();
                }
            }
            
            // Ctrl/Cmd + Down Arrow or End key to scroll to bottom
            if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowDown' || e.key === 'End')) {
                e.preventDefault();
                this.scrollToBottom();
            }
            
            // Page Down key in chat to scroll down
            if (e.key === 'PageDown' && document.getElementById('chat-page') && !document.getElementById('chat-page').classList.contains('hidden')) {
                const container = document.getElementById('messages-container');
                if (container && container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
                    // If already near bottom, scroll to very bottom
                    e.preventDefault();
                    this.scrollToBottom();
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
            
            // Mark messages from this user as seen
            this.markMessagesAsSeen(userId);
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
            } else if (response.status === 401 || response.status === 403) {
                // Authentication failed - silent logout and refresh
                this.handleAuthError();
                return;
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
        // showToast(`${userData.username} came online`, 'info'); // Removed
    }

    handleUserOffline(userData) {
        // Remove user from online list
        this.loadOnlineUsers();
        // showToast(`${userData.username} went offline`, 'info'); // Removed
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
        this.messageCache.clear();
        
        // Cancel any active reply
        if (this.replyToMessage) {
            this.cancelReply();
        }

        messages.forEach(message => {
            this.addMessageToChat(message);
        });

        // Scroll to bottom after all messages are loaded with a delay to ensure DOM is fully updated
        setTimeout(() => {
            this.scrollToBottom(false, true); // Force scroll for initial load
        }, 200); // Increased delay to ensure all images and content are loaded
    }

    addMessageToChat(message) {
        const container = document.getElementById('messages-container');
        if (!container) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender._id === this.currentUser.id ? 'own' : ''} ${message.isReply ? 'is-reply' : ''}`;

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
                    ${this.getReplyContextHTML(message)}
                    <div class="emotion-display">
                        <span class="emotion-text ${emotionClass}">
                            ${message.emotionData.emotion} ${emotionEmoji}
                        </span>
                    </div>
                    <div class="message-time-status">
                        <div class="message-time">${formatTime(message.timestamp)}</div>
                        ${this.getMessageStatusHTML(message, this.isLastMessage(message._id))}
                    </div>
                </div>
            `;
        } else if (message.messageType === 'mood_image') {
            messageContent = `
                <div class="message-content">
                    ${this.getReplyContextHTML(message)}
                    <img src="${message.imageUrl}" alt="Mood Image" class="mood-image" onload="if(window.chatApp) window.chatApp.scrollToBottom();">
                    <p class="message-text">${message.content}</p>
                    <div class="message-time-status">
                        <div class="message-time">${formatTime(message.timestamp)}</div>
                        ${this.getMessageStatusHTML(message, this.isLastMessage(message._id))}
                    </div>
                </div>
            `;
        } else {
            // Check if message contains only emojis
            const emojiOnlyClass = this.isEmojiOnly(message.content) ? 'emoji-only' : '';
            
            messageContent = `
                <div class="message-content">
                    ${this.getReplyContextHTML(message)}
                    <p class="message-text ${emojiOnlyClass}">${escapeHtml(message.content)}</p>
                    <div class="message-time-status">
                        <div class="message-time">${formatTime(message.timestamp)}</div>
                        ${this.getMessageStatusHTML(message, this.isLastMessage(message._id))}
                    </div>
                </div>
            `;
        }

        console.log(`🏗️ Creating message HTML for: ${message._id}`);
        messageElement.innerHTML = `
            <!-- Message Options Button -->
            <div class="message-options-btn" data-message-id="${message._id}">
                <i class="fas fa-ellipsis-v"></i>
            </div>
            
            <!-- Message Options Menu -->
            <div class="message-options-menu hidden" data-message-id="${message._id}">
                <button class="option-btn react-btn" data-action="react" data-message-id="${message._id}">
                    <i class="fas fa-smile"></i>
                    <span>React</span>
                </button>
                <button class="option-btn reply-btn" data-action="reply" data-message-id="${message._id}">
                    <i class="fas fa-reply"></i>
                    <span>Reply</span>
                </button>
            </div>
            
            <img src="${message.sender.profilePicture || '/images/default-avatar.png'}" alt="${message.sender.username}" onload="if(window.chatApp) window.chatApp.scrollToBottom();">
            ${messageContent}
            
            <!-- Message Reactions -->
            <div class="message-reactions" data-message-id="${message._id}">
                ${this.getMessageReactionsHTML(message)}
            </div>
        `;
        console.log(`✅ Message HTML created for: ${message._id}`);

        container.appendChild(messageElement);
        
        // Set message ID for status updates
        messageElement.setAttribute('data-message-id', message._id);
        
        // Store message in cache for reply functionality
        this.messageCache.set(message._id, message);

        // Add double-click/double-tap event listener for options menu
        this.addDoubleClickListener(messageElement, message);
        
        // Add message options event listeners
        this.addMessageOptionsEventListeners(messageElement, message);
        
        // Refresh all message statuses to update "last message" indicators
        setTimeout(() => {
            this.refreshAllMessageStatuses();
        }, 10);
        
        // Auto-scroll to bottom after adding message with slight delay to ensure DOM is updated
        setTimeout(() => {
            this.scrollToBottom();
        }, 50);
    }

    // Add message and force scroll (for sent messages)
    addMessageToChatAndScroll(message) {
        this.addMessageToChat(message);
        setTimeout(() => {
            this.scrollToBottom(true, true);
        }, 50);
    }

    // Add message with smart scroll (for received messages)
    addMessageToChatSmart(message) {
        this.addMessageToChat(message);
        setTimeout(() => {
            if (this.isAtBottom()) {
                this.scrollToBottom();
            } else {
                this.showNewMessagesIndicator();
            }
        }, 50);
    }

    // Check if a message is the last message sent by current user
    isLastMessage(messageId) {
        const messagesContainer = document.getElementById('messages');
        if (!messagesContainer) return false;
        
        const allMessages = messagesContainer.querySelectorAll('.message');
        const currentUserMessages = Array.from(allMessages).filter(msg => 
            msg.classList.contains('own-message')
        );
        
        if (currentUserMessages.length === 0) return false;
        
        const lastMessage = currentUserMessages[currentUserMessages.length - 1];
        return lastMessage && lastMessage.dataset.messageId === messageId;
    }

    // Generate message status HTML
    getMessageStatusHTML(message, isLastMessage = false) {
        // Only show status for own messages, not for received messages
        if (message.sender._id !== this.currentUser.id) {
            return '';
        }

        const status = message.status || 'sent';
        let statusIcon = '';
        let statusText = '';
        let statusClass = `status-${status}`;

        // Show double ticks on all messages, and "Seen" text only on last message
        if (status === 'sent') {
            statusIcon = '✓';
            statusText = isLastMessage ? 'Sent' : '';
        } else if (status === 'delivered' || status === 'seen') {
            statusIcon = '✓✓';
            // Only show "Seen" text on the last message
            if (status === 'seen' && isLastMessage) {
                statusText = 'Seen';
                statusClass += ' double-check';
            } else {
                statusText = ''; // No text for non-last messages
                statusClass = 'status-delivered'; // Keep consistent styling
            }
        } else {
            statusIcon = '⏳';
            statusText = 'Sending...';
            statusClass = 'status-sending';
        }

        return `
            <div class="message-status ${statusClass}" data-status="${status}">
                <span class="status-icon">${statusIcon}</span>
                ${statusText ? `<span class="status-text">${statusText}</span>` : ''}
            </div>
        `;
    }

    // Generate reply context HTML
    getReplyContextHTML(message) {
        if (!message.isReply || !message.replyTo) {
            return '';
        }

        const replyToMessage = message.replyTo;
        let replyContent = '';

        if (replyToMessage.messageType === 'emotion') {
            replyContent = `${replyToMessage.emotionData.emotion} emotion`;
        } else if (replyToMessage.messageType === 'mood_image') {
            replyContent = 'Mood image';
        } else {
            replyContent = replyToMessage.content;
        }

        // Truncate long content
        if (replyContent.length > 60) {
            replyContent = replyContent.substring(0, 60) + '...';
        }

        return `
            <div class="reply-context">
                <div class="reply-header">
                    <span>↳ Replying to ${replyToMessage.sender.username}</span>
                </div>
                <div class="reply-content">${escapeHtml(replyContent)}</div>
            </div>
        `;
    }



    // Update message status in UI
    updateMessageStatus(messageId, newStatus) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) return;

        const statusElement = messageElement.querySelector('.message-status');
        if (!statusElement) return;

        // Check if this is the last message
        const isLast = this.isLastMessage(messageId);
        
        let statusIcon = '';
        let statusText = '';
        let statusClass = `message-status status-${newStatus}`;

        // Show double ticks on all messages, and "Seen" text only on last message
        if (newStatus === 'delivered' || newStatus === 'seen') {
            statusIcon = '✓✓';
            // Only show "Seen" text on the last message
            if (newStatus === 'seen' && isLast) {
                statusText = 'Seen';
                statusClass += ' double-check';
            } else {
                statusText = ''; // No text for non-last messages
                statusClass = 'message-status status-delivered'; // Keep consistent styling
            }
        }

        statusElement.className = statusClass;
        statusElement.setAttribute('data-status', newStatus);
        statusElement.innerHTML = `
            <span class="status-icon">${statusIcon}</span>
            ${statusText ? `<span class="status-text">${statusText}</span>` : ''}
        `;

        console.log(`✅ Updated message ${messageId} status to ${newStatus}`);
    }

    // Refresh all message statuses (called when new message is added)
    refreshAllMessageStatuses() {
        const messageElements = document.querySelectorAll('.message.own-message');
        messageElements.forEach(messageElement => {
            const messageId = messageElement.dataset.messageId;
            const statusElement = messageElement.querySelector('.message-status');
            if (!statusElement || !messageId) return;

            const currentStatus = statusElement.dataset.status;
            if (currentStatus) {
                this.updateMessageStatus(messageId, currentStatus);
            }
        });
    }

    // Handle multiple messages seen
    handleMessagesSeen(data) {
        // Update all own messages in current chat to seen
        if (this.currentChatUser && this.currentChatUser.id === data.receiverId) {
            const ownMessages = document.querySelectorAll('.message.own');
            ownMessages.forEach(messageEl => {
                const statusEl = messageEl.querySelector('.message-status');
                if (statusEl && statusEl.getAttribute('data-status') !== 'seen') {
                    const messageId = messageEl.getAttribute('data-message-id');
                    this.updateMessageStatus(messageId, 'seen');
                }
            });
        }
    }

    // Mark messages as seen when opening chat
    markMessagesAsSeen(senderId) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('mark_messages_seen', { senderId });
            console.log('👁️ Marking messages as seen from:', senderId);
        }
    }

    // Mark single message as seen
    markSingleMessageAsSeen(messageId) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('message_seen', { messageId });
            console.log('👁️ Marking single message as seen:', messageId);
        }
    }

    // Mark visible messages as seen when scrolling
    markVisibleMessagesAsSeen() {
        if (!this.currentChatUser || this.currentChatUser.id === this.currentUser.id) return;

        const container = document.getElementById('messages-container');
        if (!container) return;

        // Find all received messages that are visible in viewport
        const receivedMessages = container.querySelectorAll('.message:not(.own)');
        const containerRect = container.getBoundingClientRect();
        
        receivedMessages.forEach(messageEl => {
            const messageRect = messageEl.getBoundingClientRect();
            const messageId = messageEl.getAttribute('data-message-id');
            
            // Check if message is visible in viewport
            if (messageRect.top >= containerRect.top && 
                messageRect.bottom <= containerRect.bottom && 
                messageId && !messageEl.dataset.seen) {
                
                // Mark as seen and prevent duplicate calls
                messageEl.dataset.seen = 'true';
                this.markSingleMessageAsSeen(messageId);
            }
        });
    }

    // Setup scroll monitoring
    setupScrollMonitoring() {
        const container = document.getElementById('messages-container');
        if (!container) return;

        let isScrolling = false;
        
        container.addEventListener('scroll', () => {
            if (!isScrolling) {
                window.requestAnimationFrame(() => {
                    if (this.isAtBottom()) {
                        this.hideNewMessagesIndicator();
                        this.markVisibleMessagesAsSeen();
                    }
                    isScrolling = false;
                });
                isScrolling = true;
            }
        });
    }

    // Start reply to a message
    startReply(messageId) {
        console.log('🔄 Starting reply to message:', messageId);
        
        // Find the message in the current chat
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) return;

        // Add visual feedback
        messageElement.classList.add('reply-starting');
        setTimeout(() => {
            messageElement.classList.remove('reply-starting');
        }, 300);

        // Get message data from cache
        const messageData = this.getMessageDataById(messageId);
        if (!messageData) {
            console.error('Message data not found for reply');
            showToast('Cannot reply to this message', 'error');
            return;
        }

        this.replyToMessage = messageData;
        this.showReplyPreview();
        
        // Focus on message input with small delay
        setTimeout(() => {
            const messageInput = document.getElementById('message-input');
            if (messageInput) {
                messageInput.focus();
            }
        }, 100);

        // Show success feedback - removed
    }

    // Get message data by ID from cache
    getMessageDataById(messageId) {
        return this.messageCache.get(messageId) || null;
    }

    // Add double-click/double-tap event listener for options menu
    addDoubleClickListener(messageElement, message) {
        let tapCount = 0;
        let tapTimer = null;
        
        // Handle double-click for desktop
        messageElement.addEventListener('dblclick', (e) => {
            e.preventDefault();
            this.showMessageOptions(messageElement, message);
        });

        // Handle double-tap for mobile
        messageElement.addEventListener('touchend', (e) => {
            tapCount++;
            
            if (tapCount === 1) {
                tapTimer = setTimeout(() => {
                    tapCount = 0; // Reset after single tap timeout
                }, 300);
            } else if (tapCount === 2) {
                clearTimeout(tapTimer);
                tapCount = 0;
                e.preventDefault();
                this.showMessageOptions(messageElement, message);
            }
        });

        // Add visual feedback for double-click/tap
        messageElement.style.cursor = 'pointer';
        messageElement.setAttribute('title', 'Double-click for options');
    }

    // Show message options menu (called on double-click)
    showMessageOptions(messageElement, message) {
        console.log('🎯 Showing message options for:', message._id);
        
        const optionsBtn = messageElement.querySelector('.message-options-btn');
        const optionsMenu = messageElement.querySelector('.message-options-menu');
        
        if (!optionsBtn || !optionsMenu) {
            console.warn('❌ Message options elements not found for message:', message._id);
            return;
        }
        
        // Hide all other open menus first
        this.hideAllMessageOptionsMenus();
        
        // Show the options button and menu
        optionsBtn.classList.add('visible');
        optionsMenu.classList.remove('hidden');
        optionsMenu.classList.add('visible');
        
        console.log('✅ Message options shown for:', message._id);
        
        // Auto-hide after 5 seconds if no interaction
        setTimeout(() => {
            if (optionsMenu.classList.contains('visible')) {
                optionsBtn.classList.remove('visible');
                optionsMenu.classList.remove('visible');
                optionsMenu.classList.add('hidden');
                console.log('⏰ Auto-hidden options for:', message._id);
            }
        }, 5000);
    }

    // Show reply preview above message input
    showReplyPreview() {
        if (!this.replyToMessage) return;

        const chatPage = document.getElementById('chat-page');
        const existingPreview = document.getElementById('reply-preview');
        
        // Remove existing preview
        if (existingPreview) {
            existingPreview.remove();
        }

        const replyPreview = document.createElement('div');
        replyPreview.id = 'reply-preview';
        replyPreview.className = 'reply-input-container';

        let replyContent = this.replyToMessage.content;
        if (replyContent.length > 60) {
            replyContent = replyContent.substring(0, 60) + '...';
        }

        replyPreview.innerHTML = `
            <div class="reply-preview">
                <div class="reply-preview-content">
                    <div class="reply-preview-header">
                        Replying to ${this.replyToMessage.sender.username}
                    </div>
                    <div class="reply-preview-text">${escapeHtml(replyContent)}</div>
                </div>
                <button class="cancel-reply" onclick="window.chatApp.cancelReply()" title="Cancel reply">
                    ✕
                </button>
            </div>
        `;

        // Insert into body for fixed positioning
        document.body.appendChild(replyPreview);
        
        // Add class to body to indicate reply is active
        document.body.classList.add('reply-active');
    }

    // Cancel reply
    cancelReply() {
        this.replyToMessage = null;
        const replyPreview = document.getElementById('reply-preview');
        if (replyPreview) {
            replyPreview.remove();
        }
        
        // Remove reply-active class from body
        document.body.classList.remove('reply-active');
        
        // Focus back on message input
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.focus();
        }
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

        // Debug: Check current user
        console.log('🐛 Debug - Current user:', this.currentUser);
        console.log('🐛 Debug - Current user ID:', this.currentUser?.id);
        
        const messageData = {
            content,
            messageType: 'text',
            sender: this.currentUser.id // Add sender ID (current user)
        };
        
        console.log('🐛 Debug - Message data being sent:', messageData);

        // Add reply data if replying to a message
        if (this.replyToMessage) {
            messageData.replyTo = this.replyToMessage._id;
        }

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

            // Clear reply if there was one
            if (this.replyToMessage) {
                this.cancelReply();
            }
            
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
                this.addMessageToChatAndScroll(message); // Force scroll for received messages
                this.playNotificationSound();
                
                // Mark message as seen if user is at bottom (actively viewing)
                if (this.isAtBottom()) {
                    setTimeout(() => {
                        this.markSingleMessageAsSeen(message._id);
                    }, 1000); // Delay to ensure user actually saw it
                }
            }
        }
        
        // Show toast notification - removed
    }

    // Handle sent message confirmation
    handleMessageSent(message) {
        console.log('📤 Processing sent message confirmation:', message);
        
        // Always display sent messages in current chat
        if (this.currentChatUser) {
            this.addMessageToChatAndScroll(message); // Force scroll for sent messages
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

    scrollToBottom(smooth = true, force = false) {
        const container = document.getElementById('messages-container');
        if (container) {
            // Always scroll for new messages or if forced
            if (force) {
                // Force scroll immediately for page loads
                container.scrollTop = container.scrollHeight;
                return;
            }
            
            // For new messages, always scroll with smooth behavior
            if (smooth && container.scrollTo) {
                // Smooth scrolling for better UX
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            } else {
                // Fallback for older browsers
                container.scrollTop = container.scrollHeight;
            }
        }
    }

    // Check if user is at the bottom of chat
    isAtBottom() {
        const container = document.getElementById('messages-container');
        if (!container) return true;
        return container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
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

    logout() {
        // Set logout flag to prevent any UI updates
        this.isLoggingOut = true;
        
        // Clear local storage immediately  
        localStorage.clear(); // Clear everything to be sure
        
        // Disconnect socket immediately without any listeners
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }

        // Immediately refresh the page - don't wait for anything
        window.location.reload();
    }

    // Handle automatic logout when authentication fails
    handleAuthError() {
        // Don't show messages, just logout and refresh
        this.logout();
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

    // 🎭 MESSAGE REACTIONS HELPER
    getMessageReactionsHTML(message) {
        console.log(`🎭 Getting reactions HTML for message:`, message._id);
        console.log(`🎭 Message reactions:`, message.reactions);
        console.log(`🎭 Current user ID:`, this.currentUser?.id);
        
        if (!message.reactions || Object.keys(message.reactions).length === 0) {
            console.log(`🎭 No reactions to display`);
            return '';
        }

        let reactionsHTML = '';
        for (const [emoji, users] of Object.entries(message.reactions)) {
            const count = users.length;
            const currentUserId = this.currentUser?.id || 'demo-user-123';
            const hasCurrentUser = users.includes(currentUserId);
            
            console.log(`🎭 Processing reaction: ${emoji}, users: ${users}, count: ${count}, hasCurrentUser: ${hasCurrentUser}`);
            
            reactionsHTML += `
                <button class="reaction-item ${hasCurrentUser ? 'own-reaction' : ''}" 
                        data-emoji="${emoji}" 
                        data-message-id="${message._id}"
                        title="${users.map(userId => this.getUsernameById(userId)).join(', ')}">
                    <span class="reaction-emoji">${emoji}</span>
                </button>
            `;
        }

        console.log(`🎭 Generated reactions HTML:`, reactionsHTML);
        return reactionsHTML;
    }

    // 🎯 MESSAGE OPTIONS EVENT LISTENERS
    addMessageOptionsEventListeners(messageElement, message) {
        console.log(`🎯 Setting up event listeners for message: ${message._id}`);
        
        const optionsBtn = messageElement.querySelector('.message-options-btn');
        const optionsMenu = messageElement.querySelector('.message-options-menu');
        
        console.log('🔍 Options button found:', !!optionsBtn);
        console.log('🔍 Options menu found:', !!optionsMenu);
        console.log('🔍 Message element:', messageElement);
        
        if (!optionsBtn || !optionsMenu) {
            console.warn('❌ Message options elements not found for message:', message._id);
            console.log('📄 Message element HTML:', messageElement.innerHTML);
            return;
        }
        
        console.log('✅ Message options elements found for:', message._id);

        // Options are now shown only via double-click, not hover

        // Toggle options menu
        optionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('🎯 Options button clicked for message:', message._id);
            this.hideAllMessageOptionsMenus();
            optionsMenu.classList.toggle('hidden');
            optionsMenu.classList.toggle('visible');
            console.log('✅ Menu visibility toggled');
        });

        // Handle option clicks
        const optionBtns = optionsMenu.querySelectorAll('.option-btn');
        console.log(`🔧 Found ${optionBtns.length} option buttons for message ${message._id}`);
        
        optionBtns.forEach((btn, index) => {
            console.log(`🔧 Adding listener to button ${index}: ${btn.dataset.action}`);
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const messageId = btn.dataset.messageId;
                
                console.log(`🎯 Option clicked: ${action} for message ${messageId}`);
                console.log('🔍 Button element:', btn);
                console.log('🔍 Event target:', e.target);
                
                this.handleMessageOption(action, messageId, message);
                this.hideAllMessageOptionsMenus();
            });
        });

        // Handle reaction clicks
        const reactionItems = messageElement.querySelectorAll('.reaction-item');
        reactionItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const emoji = item.dataset.emoji;
                const messageId = item.dataset.messageId;
                this.toggleReaction(messageId, emoji);
            });
        });

        // Close menu on outside click
        document.addEventListener('click', () => {
            this.hideAllMessageOptionsMenus();
        });
    }

    // 🎮 HANDLE MESSAGE OPTIONS
    async handleMessageOption(action, messageId, message) {
        console.log(`🎮 Handling option: ${action} for message: ${messageId}`);
        
        switch (action) {
            case 'react':
                console.log('😊 Calling showReactionPicker...');
                this.showReactionPicker(messageId, message);
                break;
            case 'reply':
                console.log('💬 Calling startReply...');
                this.startReply(message._id);
                break;
            default:
                console.warn('❓ Unknown action:', action);
        }
    }



    // 😊 SHOW REACTION PICKER
    showReactionPicker(messageId, message) {
        console.log(`😊 Showing reaction picker for message: ${messageId}`);
        
        // Hide the options menu first
        this.hideAllMessageOptionsMenus();
        
        // Remove any existing picker
        const existingPicker = document.querySelector('.reaction-picker');
        if (existingPicker) existingPicker.remove();
        
        // Create a temporary reaction picker
        const reactionPicker = document.createElement('div');
        reactionPicker.className = 'reaction-picker';
        reactionPicker.innerHTML = `
            <div class="reaction-picker-content">
                <div class="quick-reactions">
                    ${['❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🔥'].map(emoji => 
                        `<button class="quick-reaction-btn" data-emoji="${emoji}">${emoji}</button>`
                    ).join('')}
                </div>
                <button class="more-reactions-btn">
                    <i class="fas fa-smile"></i>
                    More reactions
                </button>
            </div>
        `;

        // Position near the message
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.appendChild(reactionPicker);
            
            // Handle quick reaction clicks
            reactionPicker.querySelectorAll('.quick-reaction-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const emoji = btn.dataset.emoji;
                    console.log(`🎯 Quick reaction clicked: ${emoji} for message: ${messageId}`);
                    this.addReaction(messageId, emoji);
                    reactionPicker.remove();
                });
            });

            // Handle more reactions button
            reactionPicker.querySelector('.more-reactions-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                reactionPicker.remove();
                this.showMainEmojiPickerForReaction(messageId);
            });

            // Remove on outside click
            setTimeout(() => {
                const handleOutsideClick = (e) => {
                    if (!reactionPicker.contains(e.target)) {
                        reactionPicker.remove();
                        document.removeEventListener('click', handleOutsideClick);
                    }
                };
                document.addEventListener('click', handleOutsideClick);
            }, 100);
        }
    }

    // 🎭 SHOW MAIN EMOJI PICKER FOR REACTIONS
    showMainEmojiPickerForReaction(messageId) {
        console.log('🎯 Setting reaction message ID:', messageId);
        this.reactionMessageId = messageId;
        console.log('🎯 Reaction message ID set to:', this.reactionMessageId);
        
        // Show the main emoji picker
        if (window.modernEmojiPicker) {
            console.log('🎯 Opening main emoji picker for reaction');
            window.modernEmojiPicker.show();
        } else {
            console.error('❌ Modern emoji picker not found');
        }
    }

    // ➕ ADD REACTION
    async addReaction(messageId, emoji) {
        console.log(`🔄 Adding/toggling reaction ${emoji} to message ${messageId}`);
        console.log(`🔍 Current user ID: ${this.currentUser?.id}`);
        console.log(`🔍 Current user:`, this.currentUser);
        console.log(`🔍 Token exists: ${!!localStorage.getItem('chatapp_token')}`);
        console.log(`🔍 Message cache has message:`, this.messageCache.has(messageId));
        console.log(`🌍 Environment: ${window.location.hostname}`);
        console.log(`🔗 Base URL: ${window.location.origin}`);
        
        // Check if we have authentication - if not, use mock for demo
        if (!this.currentUser?.id) {
            console.error('❌ No authenticated user - using mock reaction (with toggle) for demo');
            this.addMockReaction(messageId, emoji);
            return;
        }
        
        try {
            const apiUrl = `/api/messages/${messageId}/react`;
            console.log(`📡 Making API call to: ${window.location.origin}${apiUrl}`);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('chatapp_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ emoji })
            });

            console.log(`📡 Reaction API response status: ${response.status}`);
            console.log(`📡 Response headers:`, [...response.headers.entries()]);

            if (response.ok) {
                const updatedMessage = await response.json();
                console.log(`✅ Reaction response:`, updatedMessage);
                console.log(`🎭 Reactions in response:`, updatedMessage.reactions);
                
                // Update reactions immediately
                this.updateMessageReactions(messageId, updatedMessage.reactions);
                
                // Double-check that the reaction appeared
                setTimeout(() => {
                    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
                    const reactionItems = messageElement?.querySelectorAll('.reaction-item');
                    console.log(`🔍 Post-update check: ${reactionItems?.length || 0} reactions visible`);
                    
                    if (!reactionItems || reactionItems.length === 0) {
                        console.warn('⚠️ No reactions visible after update - forcing refresh');
                        this.updateMessageReactions(messageId, updatedMessage.reactions);
                    }
                }, 100);
                
                // Add to recent emojis for quick access
                if (window.modernEmojiPicker) {
                    window.modernEmojiPicker.addToRecent(emoji);
                }
                
                console.log(`✨ Successfully added reaction ${emoji} to message ${messageId}`);
            } else if (response.status === 404) {
                console.warn('⚠️ Server endpoint not found - using mock reaction (with toggle) for demo');
                this.addMockReaction(messageId, emoji);
            } else {
                const errorText = await response.text();
                console.error(`❌ Failed to add reaction: ${response.status} - ${errorText}`);
                console.error(`❌ Error response:`, errorText);
                
                // Fallback to mock reaction for demo
                console.warn('⚠️ Using mock reaction (with toggle) as fallback');
                this.addMockReaction(messageId, emoji);
            }
        } catch (error) {
            console.error('❌ Error adding reaction:', error);
            console.error('❌ Full error:', error.stack);
            
            // Fallback to mock reaction when server is not available
            console.warn('⚠️ Server unavailable - using mock reaction (with toggle) for demo');
            this.addMockReaction(messageId, emoji);
        }
    }
    
    // 🧪 ADD MOCK REACTION (for testing without server)
    addMockReaction(messageId, emoji) {
        console.log(`🧪 Adding mock reaction ${emoji} to message ${messageId}`);
        console.log(`🧪 Current user for mock reaction:`, this.currentUser);
        
        // Get current message from cache
        const message = this.messageCache.get(messageId);
        if (!message) {
            console.error('❌ Message not found in cache');
            console.error('❌ Available message IDs in cache:', Array.from(this.messageCache.keys()));
            return;
        }
        
        // Create a demo user ID if currentUser is not available
        let userId = this.currentUser?.id || 'demo-user-123';
        console.log(`🧪 Using user ID for reaction:`, userId);
        
        // Initialize reactions if they don't exist
        if (!message.reactions) {
            message.reactions = {};
        }
        
        // Add or toggle reaction
        if (!message.reactions[emoji]) {
            message.reactions[emoji] = [];
        }
        
        const userIndex = message.reactions[emoji].indexOf(userId);
        let actionTaken = '';
        
        console.log(`🔍 Debug toggle - emoji: ${emoji}, userId: ${userId}`);
        console.log(`🔍 Current users for ${emoji}:`, message.reactions[emoji]);
        console.log(`🔍 User index in array: ${userIndex}`);
        
        if (userIndex === -1) {
            // Add reaction
            message.reactions[emoji].push(userId);
            actionTaken = 'added';
            console.log(`✅ Added reaction ${emoji} for user ${userId}`);
            console.log(`✅ Updated users for ${emoji}:`, message.reactions[emoji]);
        } else {
            // Remove reaction (toggle off)
            message.reactions[emoji].splice(userIndex, 1);
            if (message.reactions[emoji].length === 0) {
                delete message.reactions[emoji];
                console.log(`🗑️ Deleted empty ${emoji} reaction array`);
            }
            actionTaken = 'removed';
            console.log(`➖ Removed reaction ${emoji} for user ${userId} (toggled off)`);
            console.log(`➖ Updated users for ${emoji}:`, message.reactions[emoji] || 'DELETED');
        }
        
        // Update the DOM
        this.updateMessageReactions(messageId, message.reactions);
        
        // Add to recent emojis
        if (window.modernEmojiPicker) {
            window.modernEmojiPicker.addToRecent(emoji);
        }
        
        console.log(`✨ Mock reaction ${emoji} ${actionTaken} for message ${messageId}`);
    }

    // 🔄 TOGGLE REACTION
    async toggleReaction(messageId, emoji) {
        console.log(`🔄 Toggling reaction ${emoji} on message ${messageId}`);
        
        // Use mock reaction directly for demo
        this.addMockReaction(messageId, emoji);
    }

    // 🔄 UPDATE MESSAGE REACTIONS IN DOM
    updateMessageReactions(messageId, reactions) {
        console.log(`🔄 Updating reactions for message ${messageId}:`, reactions);
        
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        console.log(`🔍 Message element found:`, !!messageElement);
        
        if (!messageElement) {
            console.error('❌ Message element not found for reaction update');
            console.error('❌ Looking for element with selector:', `[data-message-id="${messageId}"]`);
            const allMessageElements = document.querySelectorAll('[data-message-id]');
            console.error('❌ Available message elements:', allMessageElements.length);
            allMessageElements.forEach((el, index) => {
                console.error(`❌ Element ${index}: ID = ${el.getAttribute('data-message-id')}`);
            });
            return;
        }
        
        const reactionsContainer = messageElement.querySelector('.message-reactions');
        console.log(`🔍 Reactions container found:`, !!reactionsContainer);
        
        if (!reactionsContainer) {
            console.error('❌ Reactions container not found in message element');
            console.error('❌ Message element outerHTML:', messageElement.outerHTML);
            console.error('❌ Looking for container with selector: .message-reactions');
            const allReactionContainers = messageElement.querySelectorAll('*');
            console.error('❌ All child elements:', Array.from(allReactionContainers).map(el => el.className));
            return;
        }
        
        const message = this.messageCache.get(messageId);
        console.log(`🔍 Message in cache:`, !!message);
        
        if (message) {
            message.reactions = reactions;
            const reactionsHTML = this.getMessageReactionsHTML(message);
            console.log(`🎨 Generated reactions HTML:`, reactionsHTML);
            console.log(`🎨 HTML length:`, reactionsHTML.length);
            
            reactionsContainer.innerHTML = reactionsHTML;
            console.log(`🎨 Container updated. New innerHTML:`, reactionsContainer.innerHTML);
            
            // Re-add event listeners for new reaction items
            const reactionItems = reactionsContainer.querySelectorAll('.reaction-item');
            console.log(`🎯 Found ${reactionItems.length} reaction items to add listeners to`);
            
            reactionItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const emoji = item.dataset.emoji;
                    console.log(`🔄 Toggling reaction: ${emoji}`);
                    this.toggleReaction(messageId, emoji);
                });
            });
            
            console.log(`✅ Reactions updated for message ${messageId}`);
        } else {
            console.error('❌ Message not found in cache');
        }
    }

    // 🙈 HIDE ALL MESSAGE OPTIONS MENUS
    hideAllMessageOptionsMenus() {
        document.querySelectorAll('.message-options-menu.visible').forEach(menu => {
            menu.classList.add('hidden');
            menu.classList.remove('visible');
        });
        
        document.querySelectorAll('.message-options-btn.visible').forEach(btn => {
            btn.classList.remove('visible');
        });
    }

    // 👤 GET USERNAME BY ID (helper for reaction tooltips)
    getUsernameById(userId) {
        if (this.currentUser?.id && userId === this.currentUser.id) return 'You';
        
        // Handle demo users
        if (userId.startsWith('demo-user-')) return 'You';
        
        // Try to find user in message cache
        for (const message of this.messageCache.values()) {
            if (message.sender._id === userId) {
                return message.sender.username;
            }
        }
        
        // Check if it's the current chat partner
        if (this.currentReceiver && this.currentReceiver.id === userId) {
            return this.currentReceiver.username;
        }
        
        return 'Someone';
    }

    // 🧪 TEST REACTION FUNCTIONALITY (for debugging)
    testReaction() {
        console.log('🧪 Testing reaction functionality...');
        
        // Find the first message element
        const firstMessage = document.querySelector('[data-message-id]');
        if (!firstMessage) {
            console.error('❌ No messages found to test reaction on');
            return;
        }
        
        const messageId = firstMessage.getAttribute('data-message-id');
        console.log('🎯 Testing reaction on message:', messageId);
        
        // Test adding a heart reaction
        this.addMockReaction(messageId, '❤️');
    }


}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ChatApp();
    
    // Add debug functions to window for browser console testing
    window.testReaction = () => {
        if (window.chatApp) {
            window.chatApp.testReaction();
        } else {
            console.error('❌ ChatApp not initialized');
        }
    };
    
    window.debugReactions = () => {
        console.log('🔍 Debugging reaction system...');
        console.log('🔍 Available message elements:', document.querySelectorAll('[data-message-id]').length);
        console.log('🔍 ChatApp instance:', !!window.chatApp);
        console.log('🔍 Current user:', window.chatApp?.currentUser);
        console.log('🔍 Message cache size:', window.chatApp?.messageCache?.size);
    };
});