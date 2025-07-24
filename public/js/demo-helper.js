/* 🎭 DEMO HELPER FOR MESSAGE OPTIONS */

// Add this to help demonstrate the message options functionality
window.addDemoReactions = function() {
    console.log('🎭 Adding demo reactions...');
    
    // Get all message elements
    const messageElements = document.querySelectorAll('.message[data-message-id]');
    
    messageElements.forEach((messageElement, index) => {
        const messageId = messageElement.getAttribute('data-message-id');
        const reactionsContainer = messageElement.querySelector('.message-reactions');
        
        if (reactionsContainer && index < 3) { // Add reactions to first 3 messages
            const demoReactions = [
                { emoji: '❤️', count: 2, users: ['user1', 'user2'] },
                { emoji: '😂', count: 1, users: ['user1'] },
                { emoji: '👍', count: 3, users: ['user1', 'user2', 'you'] }
            ];
            
            const reactionHTML = demoReactions.map(reaction => `
                <button class="reaction-item ${reaction.users.includes('you') ? 'own-reaction' : ''}" 
                        data-emoji="${reaction.emoji}" 
                        data-message-id="${messageId}"
                        title="${reaction.users.join(', ')}">
                    <span class="reaction-emoji">${reaction.emoji}</span>
                </button>
            `).join('');
            
            reactionsContainer.innerHTML = reactionHTML;
        }
    });
    
    console.log('✅ Demo reactions added!');
};

// Add this to make options always visible for testing
window.showAllMessageOptions = function() {
    console.log('🔧 Making all message options visible...');
    document.querySelectorAll('.message-options-btn').forEach(btn => {
        btn.style.opacity = '1';
        btn.style.visibility = 'visible';
        btn.style.backgroundColor = 'rgba(255, 0, 0, 0.3)'; // Make them red for visibility
    });
    console.log('✅ All message options are now visible!');
};

// Test reaction functionality
window.testReactions = function() {
    console.log('🧪 Testing reaction functionality...');
    
    // Ensure user is logged in
    if (!window.chatApp?.currentUser) {
        console.log('👤 No user found, creating demo login...');
        window.demoLogin();
    }
    
    const messages = document.querySelectorAll('.message[data-message-id]');
    console.log(`🔍 Found ${messages.length} messages`);
    
    if (messages.length > 0) {
        const firstMessage = messages[0];
        const messageId = firstMessage.getAttribute('data-message-id');
        console.log('🎯 Testing reaction on message:', messageId);
        
        // Try to add a heart reaction
        if (window.chatApp) {
            console.log('🎯 ChatApp found, adding reaction...');
            window.chatApp.addReaction(messageId, '❤️');
        } else {
            console.error('❌ ChatApp instance not found');
        }
    } else {
        console.warn('⚠️ No messages found to test reactions on');
    }
};

// Debug current user
window.debugUser = function() {
    if (window.chatApp) {
        console.log('👤 Current user:', window.chatApp.currentUser);
        console.log('🔑 Token exists (chatapp_token):', !!localStorage.getItem('chatapp_token'));
        console.log('🔑 Token exists (token):', !!localStorage.getItem('token'));
        console.log('🔑 User data exists:', !!localStorage.getItem('chatapp_user'));
    } else {
        console.error('❌ ChatApp not found');
    }
};

// Demo login for testing (bypasses server authentication)
window.demoLogin = function() {
    console.log('🧪 Creating demo login...');
    
    // Create fake user and token for testing
    const demoUser = {
        id: 'demo-user-123',
        username: 'Demo User',
        email: 'demo@test.com',
        profilePicture: '/images/default-avatar.png'
    };
    
    const demoToken = 'demo-token-123';
    
    // Store in localStorage
    localStorage.setItem('chatapp_token', demoToken);
    localStorage.setItem('chatapp_user', JSON.stringify(demoUser));
    
    // Set in chatApp
    if (window.chatApp) {
        window.chatApp.currentUser = demoUser;
        console.log('✅ Demo user logged in:', demoUser);
        console.log('✅ Now try reactions - they should work!');
    } else {
        console.error('❌ ChatApp not found');
    }
};

// Manual reaction test (bypasses server call)
window.testManualReaction = function() {
    console.log('🧪 Testing manual reaction...');
    const messages = document.querySelectorAll('.message[data-message-id]');
    
    if (messages.length > 0) {
        const firstMessage = messages[0];
        const messageId = firstMessage.getAttribute('data-message-id');
        console.log('🎯 Adding manual reaction to message:', messageId);
        
        // First ensure we have a demo user
        if (!window.chatApp?.currentUser) {
            console.warn('⚠️ No current user, running demo login first...');
            window.demoLogin();
        }
        
        // Create fake reaction data
        const fakeReactions = {
            '❤️': ['demo-user-123'],  // Current user reacted with heart
            '👍': ['other-user-456']  // Someone else reacted with thumbs up
        };
        
        if (window.chatApp) {
            // Update reactions directly
            window.chatApp.updateMessageReactions(messageId, fakeReactions);
            console.log('✅ Manual reaction added!');
            
            // Also inspect the reactions container
            setTimeout(() => {
                const container = firstMessage.querySelector('.message-reactions');
                console.log('🔍 Reactions container:', container);
                console.log('🔍 Container HTML:', container?.innerHTML);
                console.log('🔍 Container visible:', container?.offsetHeight > 0);
            }, 100);
        } else {
            console.error('❌ ChatApp not found');
        }
    } else {
        console.warn('⚠️ No messages found');
    }
};

// Inspect existing messages and their reactions containers
window.inspectMessages = function() {
    console.log('🔍 Inspecting existing messages...');
    const messages = document.querySelectorAll('.message[data-message-id]');
    
    messages.forEach((msg, index) => {
        const messageId = msg.getAttribute('data-message-id');
        const container = msg.querySelector('.message-reactions');
        console.log(`Message ${index + 1}:`, {
            id: messageId,
            hasContainer: !!container,
            containerHTML: container?.innerHTML || 'empty',
            containerVisible: container?.offsetHeight > 0
        });
    });
};

// 🚀 QUICK REACTION TEST - All-in-one
window.quickReactionTest = function() {
    console.log('🚀 QUICK REACTION TEST - Starting...');
    
    // Step 1: Login
    if (!window.chatApp?.currentUser) {
        console.log('👤 Creating demo login...');
        window.demoLogin();
    } else {
        console.log('✅ User already logged in:', window.chatApp.currentUser.username);
    }
    
    // Step 2: Find message
    const messages = document.querySelectorAll('.message[data-message-id]');
    if (messages.length === 0) {
        console.error('❌ No messages found! Make sure you have messages loaded.');
        return;
    }
    
    const firstMessage = messages[0];
    const messageId = firstMessage.getAttribute('data-message-id');
    console.log(`🎯 Testing on message: ${messageId}`);
    
    // Step 3: Add reaction directly via mock
    console.log('💫 Adding ❤️ reaction...');
    window.chatApp.addMockReaction(messageId, '❤️');
    
    // Step 4: Check result and test toggle
    setTimeout(() => {
        const container = firstMessage.querySelector('.message-reactions');
        const hasReaction = container.innerHTML.includes('❤️');
        
        if (hasReaction) {
            console.log('🎉 SUCCESS! Reaction should be visible on the message!');
            console.log('✅ Look for the ❤️ emoji at the bottom of the first message');
            
            // Test toggle functionality
            console.log('🔄 Testing toggle functionality - clicking same reaction again...');
            setTimeout(() => {
                window.chatApp.addMockReaction(messageId, '❤️');
                setTimeout(() => {
                    const stillHasReaction = container.innerHTML.includes('❤️');
                    if (!stillHasReaction) {
                        console.log('🎉 TOGGLE SUCCESS! Reaction was removed (unreacted)');
                    } else {
                        console.log('❌ TOGGLE FAILED: Reaction still exists');
                    }
                }, 100);
            }, 1000);
        } else {
            console.log('❌ FAILED: Reaction not found in DOM');
            console.log('🔍 Container HTML:', container.innerHTML);
        }
    }, 500);
};

// Test reaction toggle functionality specifically
window.testReactionToggle = function() {
    console.log('🔄 Testing reaction toggle functionality...');
    
    // Ensure demo login
    if (!window.chatApp?.currentUser) {
        console.log('👤 Creating demo login first...');
        window.demoLogin();
    }
    
    const messages = document.querySelectorAll('.message[data-message-id]');
    if (messages.length === 0) {
        console.error('❌ No messages found for toggle test');
        return;
    }
    
    const firstMessage = messages[0];
    const messageId = firstMessage.getAttribute('data-message-id');
    const container = firstMessage.querySelector('.message-reactions');
    
    console.log(`🎯 Testing toggle on message: ${messageId}`);
    
    // Step 1: Add reaction
    console.log('1️⃣ Adding ❤️ reaction...');
    window.chatApp.addMockReaction(messageId, '❤️');
    
    setTimeout(() => {
        const hasReaction = container.innerHTML.includes('❤️');
        console.log(`✅ After adding: Reaction exists = ${hasReaction}`);
        
        if (hasReaction) {
            // Step 2: Toggle off (remove)
            console.log('2️⃣ Toggling off ❤️ reaction...');
            window.chatApp.addMockReaction(messageId, '❤️');
            
            setTimeout(() => {
                const stillExists = container.innerHTML.includes('❤️');
                console.log(`🔄 After toggling: Reaction exists = ${stillExists}`);
                
                if (!stillExists) {
                    console.log('🎉 TOGGLE SUCCESS! Reaction properly removed when clicked again');
                    
                    // Step 3: Toggle back on
                    console.log('3️⃣ Toggling back on ❤️ reaction...');
                    window.chatApp.addMockReaction(messageId, '❤️');
                    
                    setTimeout(() => {
                        const backAgain = container.innerHTML.includes('❤️');
                        if (backAgain) {
                            console.log('🎉 COMPLETE SUCCESS! Toggle works both ways - add and remove');
                        } else {
                            console.log('❌ Toggle back on failed');
                        }
                    }, 100);
                } else {
                    console.log('❌ TOGGLE FAILED! Reaction was not removed');
                }
            }, 100);
        } else {
            console.log('❌ Initial reaction add failed');
        }
    }, 100);
};

// Simple focused toggle test
window.simpleToggleTest = function() {
    console.log('🔄 SIMPLE TOGGLE TEST - Starting...');
    
    // Ensure demo login
    if (!window.chatApp?.currentUser) {
        console.log('👤 Demo login needed...');
        window.demoLogin();
    }
    
    // Find first message
    const messages = document.querySelectorAll('.message[data-message-id]');
    if (messages.length === 0) {
        console.error('❌ No messages found');
        return;
    }
    
    const messageElement = messages[0];
    const messageId = messageElement.getAttribute('data-message-id');
    const container = messageElement.querySelector('.message-reactions');
    
    console.log('🎯 Testing toggle on message:', messageId);
    console.log('🎯 Initial container HTML:', container.innerHTML);
    
    // Test 1: Add reaction
    console.log('1️⃣ Adding ❤️...');
    window.chatApp.addMockReaction(messageId, '❤️');
    
    setTimeout(() => {
        console.log('🔍 After add - HTML:', container.innerHTML);
        const hasReaction = container.innerHTML.includes('❤️');
        console.log('🔍 Has reaction:', hasReaction);
        
        if (hasReaction) {
            // Test 2: Remove reaction
            console.log('2️⃣ Toggling off ❤️...');
            window.chatApp.addMockReaction(messageId, '❤️');
            
            setTimeout(() => {
                console.log('🔍 After toggle - HTML:', container.innerHTML);
                const stillHas = container.innerHTML.includes('❤️');
                console.log('🔍 Still has reaction:', stillHas);
                
                if (!stillHas) {
                    console.log('🎉 SUCCESS! Toggle working - reaction disappeared!');
                } else {
                    console.log('❌ FAILED! Reaction still there after toggle');
                }
            }, 100);
        } else {
            console.log('❌ FAILED! Initial reaction not added');
        }
    }, 100);
};

// Visual test to showcase the new reaction styling
window.visualReactionTest = function() {
    console.log('👀 Visual Reaction Test - Adding multiple reactions to see styling...');
    
    // Ensure demo login
    if (!window.chatApp?.currentUser) {
        console.log('👤 Demo login needed...');
        window.demoLogin();
    }
    
    // Find first message
    const messages = document.querySelectorAll('.message[data-message-id]');
    if (messages.length === 0) {
        console.error('❌ No messages found');
        return;
    }
    
    const messageElement = messages[0];
    const messageId = messageElement.getAttribute('data-message-id');
    
    console.log('🎯 Adding multiple reactions to showcase styling...');
    
    // Add different reactions with delays to see the animation
    const reactions = ['❤️', '😂', '👍', '🎉', '😍'];
    
    reactions.forEach((emoji, index) => {
        setTimeout(() => {
            console.log(`Adding ${emoji}...`);
            window.chatApp.addMockReaction(messageId, emoji);
        }, index * 500);
    });
    
    console.log('✨ Watch the message for small, round reactions appearing at the LEFT CORNER!');
    console.log('🔄 Click any reaction to toggle it off/on');
};

// Test to specifically showcase the overlapping effect
window.overlapTest = function() {
    console.log('🔄 OVERLAP TEST - Testing reaction overlapping on LEFT CORNER of message bubble...');
    
    // Ensure demo login
    if (!window.chatApp?.currentUser) {
        console.log('👤 Demo login needed...');
        window.demoLogin();
    }
    
    // Find first message
    const messages = document.querySelectorAll('.message[data-message-id]');
    if (messages.length === 0) {
        console.error('❌ No messages found');
        return;
    }
    
    const messageElement = messages[0];
    const messageId = messageElement.getAttribute('data-message-id');
    const messageContent = messageElement.querySelector('.message-content');
    
    console.log('🎯 Adding reaction to test LEFT CORNER overlapping...');
    console.log('📦 Message bubble position:', messageContent.getBoundingClientRect());
    
    // Add a reaction
    window.chatApp.addMockReaction(messageId, '❤️');
    
    setTimeout(() => {
        const reactionElement = messageElement.querySelector('.reaction-item');
        if (reactionElement) {
            const reactionRect = reactionElement.getBoundingClientRect();
            const messageRect = messageContent.getBoundingClientRect();
            
            console.log('💖 Reaction position:', reactionRect);
            console.log('📦 Message position:', messageRect);
            
            // Check if reaction overlaps message
            const overlapsHorizontally = reactionRect.left < messageRect.right && reactionRect.right > messageRect.left;
            const overlapsVertically = reactionRect.top < messageRect.bottom && reactionRect.bottom > messageRect.top;
            
            // Check if it's positioned on the left side
            const isOnLeftSide = reactionRect.left <= messageRect.left + 10; // Allow some tolerance
            
            if (overlapsHorizontally && overlapsVertically && isOnLeftSide) {
                console.log('🎉 SUCCESS! Reaction is overlapping the LEFT CORNER of message bubble!');
                console.log('✅ The reaction emoji should appear on the LEFT side of the message bubble');
            } else {
                console.log('❌ FAILED! Reaction positioning issue:');
                console.log(`🔍 Overlaps horizontally: ${overlapsHorizontally}`);
                console.log(`🔍 Overlaps vertically: ${overlapsVertically}`);
                console.log(`🔍 Is on left side: ${isOnLeftSide}`);
            }
        } else {
            console.log('❌ No reaction element found');
        }
    }, 200);
};

// Add this to the console for easy testing
console.log('🎯 Demo helper loaded!');
console.log('Use window.addDemoReactions() to add sample reactions.');
console.log('Use window.showAllMessageOptions() to make options always visible.');
console.log('Use window.testReactions() to test adding a reaction.');
console.log('Use window.debugUser() to check current user and token.');
console.log('Use window.demoLogin() to create a demo login for testing reactions.');
console.log('Use window.testManualReaction() to add reactions without server calls.');
console.log('Use window.inspectMessages() to check message containers.');
console.log('🚀 QUICK TEST: Run window.quickReactionTest() for instant reaction test!');
console.log('🔄 TOGGLE TEST: Run window.testReactionToggle() to test toggle functionality!');
console.log('⚡ SIMPLE TEST: Run window.simpleToggleTest() for quick focused test!');
console.log('👀 VISUAL TEST: Run window.visualReactionTest() to see new styling!');
console.log('🔄 OVERLAP TEST: Run window.overlapTest() to see overlapping reactions!');