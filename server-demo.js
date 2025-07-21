const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// In-memory storage (for demo purposes - replace with database in production)
const users = new Map();
const messages = new Map();
const onlineUsers = new Map();
let userIdCounter = 1;
let messageIdCounter = 1;

console.log('🚀 ChatApp Server Starting...');
console.log('📝 Running in DEMO MODE with in-memory storage');
console.log('💾 Note: Data will be lost when server restarts\n');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production';

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Helper functions
function generateUserId() {
    return userIdCounter++;
}

function generateMessageId() {
    return messageIdCounter++;
}

function createUser(username, email, password) {
    const userId = generateUserId();
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const user = {
        id: userId,
        username,
        email,
        password: hashedPassword,
        profilePicture: null,
        createdAt: new Date(),
        isOnline: false
    };
    
    users.set(userId, user);
    return user;
}

function findUserByEmail(email) {
    for (let user of users.values()) {
        if (user.email === email) {
            return user;
        }
    }
    return null;
}

function findUserById(id) {
    return users.get(parseInt(id));
}

function createMessage(senderId, receiverId, content, messageType = 'text', additionalData = {}) {
    const messageId = generateMessageId();
    const message = {
        id: messageId,
        sender: findUserById(senderId),
        receiver: receiverId ? findUserById(receiverId) : null,
        content,
        messageType,
        timestamp: new Date(),
        ...additionalData
    };
    
    const key = receiverId ? `${senderId}-${receiverId}` : `${senderId}-self`;
    if (!messages.has(key)) {
        messages.set(key, []);
    }
    messages.get(key).push(message);
    
    return message;
}

function getMessages(userId1, userId2) {
    const key1 = `${userId1}-${userId2}`;
    const key2 = `${userId2}-${userId1}`;
    
    const messages1 = messages.get(key1) || [];
    const messages2 = messages.get(key2) || [];
    
    return [...messages1, ...messages2].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

function getSelfMessages(userId) {
    const key = `${userId}-self`;
    return messages.get(key) || [];
}

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Authentication routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Check if user already exists
        if (findUserByEmail(email)) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Check if username is taken
        for (let user of users.values()) {
            if (user.username === username) {
                return res.status(400).json({ message: 'Username is already taken' });
            }
        }

        // Create user
        const user = createUser(username, email, password);

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user data (without password)
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user
        const user = findUserByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Update user online status
        user.isOnline = true;

        // Return user data (without password)
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            message: 'Login successful',
            token,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/logout', authenticateToken, (req, res) => {
    try {
        const user = findUserById(req.user.id);
        if (user) {
            user.isOnline = false;
            onlineUsers.delete(req.user.id);
        }
        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// User routes
app.get('/api/profile', authenticateToken, (req, res) => {
    try {
        const user = findUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/profile', authenticateToken, (req, res) => {
    try {
        const { username } = req.body;
        const user = findUserById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!username || username.trim().length < 3) {
            return res.status(400).json({ message: 'Username must be at least 3 characters long' });
        }

        // Check if username is taken by another user
        for (let otherUser of users.values()) {
            if (otherUser.id !== user.id && otherUser.username === username) {
                return res.status(400).json({ message: 'Username is already taken' });
            }
        }

        user.username = username.trim();

        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/profile/picture', authenticateToken, upload.single('profilePicture'), (req, res) => {
    try {
        const user = findUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        user.profilePicture = `/uploads/${req.file.filename}`;

        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Profile picture update error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/users/online', authenticateToken, (req, res) => {
    try {
        const onlineUsersList = Array.from(onlineUsers.values())
            .filter(user => user.id !== req.user.id)
            .map(user => {
                const { password: _, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });

        res.json(onlineUsersList);
    } catch (error) {
        console.error('Online users fetch error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Message routes
app.get('/api/messages/:receiverId', authenticateToken, (req, res) => {
    try {
        const receiverId = parseInt(req.params.receiverId);
        const senderId = req.user.id;

        const chatMessages = getMessages(senderId, receiverId);
        res.json(chatMessages);
    } catch (error) {
        console.error('Messages fetch error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/messages/self', authenticateToken, (req, res) => {
    try {
        const userId = req.user.id;
        const selfMessages = getSelfMessages(userId);
        res.json(selfMessages);
    } catch (error) {
        console.error('Self messages fetch error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('user_join', (userData) => {
        const user = findUserById(userData.userId);
        if (user) {
            user.isOnline = true;
            user.socketId = socket.id;
            onlineUsers.set(user.id, user);
            
            socket.userId = user.id;
            socket.join(`user_${user.id}`);
            
            // Broadcast to all users that this user is online
            socket.broadcast.emit('user_online', {
                id: user.id,
                username: user.username,
                profilePicture: user.profilePicture
            });
            
            // Send current online users to the newly connected user
            const onlineUsersList = Array.from(onlineUsers.values())
                .filter(u => u.id !== user.id)
                .map(u => {
                    const { password: _, socketId: __, ...userWithoutSensitiveData } = u;
                    return userWithoutSensitiveData;
                });
            
            socket.emit('online_users', onlineUsersList);
        }
    });

    socket.on('private_message', (messageData) => {
        const senderId = socket.userId;
        const { receiverId, content, messageType, emotionData, imageUrl } = messageData;

        if (!senderId) return;

        const additionalData = {};
        if (emotionData) additionalData.emotionData = emotionData;
        if (imageUrl) additionalData.imageUrl = imageUrl;

        const message = createMessage(senderId, receiverId, content, messageType, additionalData);

        // Send to sender
        socket.emit('message_sent', message);

        // Send to receiver if online
        const receiverUser = findUserById(receiverId);
        if (receiverUser && receiverUser.socketId) {
            io.to(receiverUser.socketId).emit('new_message', message);
        }
    });

    socket.on('self_message', (messageData) => {
        const senderId = socket.userId;
        const { content, messageType, emotionData, imageUrl } = messageData;

        if (!senderId) return;

        const additionalData = {};
        if (emotionData) additionalData.emotionData = emotionData;
        if (imageUrl) additionalData.imageUrl = imageUrl;

        const message = createMessage(senderId, null, content, messageType, additionalData);

        // Send back to sender
        socket.emit('message_sent', message);
    });

    socket.on('typing', (data) => {
        const senderId = socket.userId;
        const { receiverId, isTyping } = data;

        if (!senderId) return;

        const sender = findUserById(senderId);
        const receiver = findUserById(receiverId);

        if (sender && receiver && receiver.socketId) {
            io.to(receiver.socketId).emit('user_typing', {
                userId: senderId,
                username: sender.username,
                isTyping
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        if (socket.userId) {
            const user = findUserById(socket.userId);
            if (user) {
                user.isOnline = false;
                user.socketId = null;
                onlineUsers.delete(socket.userId);
                
                // Broadcast to all users that this user is offline
                socket.broadcast.emit('user_offline', {
                    id: user.id,
                    username: user.username
                });
            }
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Open your browser and go to: http://localhost:${PORT}`);
    console.log(`📱 For mobile testing, use your local IP address\n`);
});