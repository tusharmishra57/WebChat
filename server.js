const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
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
        methods: ["GET", "POST"],
        allowedHeaders: ["*"],
        credentials: true
    },
    allowEIO3: true,
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
});

// Middleware
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp';

console.log('🚀 ChatApp Server Starting with MongoDB...');
console.log('💾 Connecting to database...\n');

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('✅ Connected to MongoDB successfully');
    console.log('🗄️ Database: Ready for persistent storage\n');
}).catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('\n🚨 MONGODB SETUP REQUIRED 🚨');
    console.log('Please set up MongoDB to use this application:');
    console.log('1. MongoDB Atlas (Cloud) - RECOMMENDED');
    console.log('   • Visit: https://www.mongodb.com/atlas/database');
    console.log('   • Create free cluster');
    console.log('   • Get connection string');
    console.log('   • Set MONGODB_URI in .env file');
    console.log('');
    console.log('2. Local MongoDB Installation');
    console.log('   • Visit: https://www.mongodb.com/try/download/community');
    console.log('   • Install and start MongoDB service');
    console.log('');
    console.log('3. Use demo mode (no database)');
    console.log('   • Run: npm run start-demo');
    console.log('\n⚠️  Server will exit in 10 seconds...\n');
    
    setTimeout(() => {
        process.exit(1);
    }, 10000);
});

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: { type: String, default: '/images/default-avatar.png' },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Message Schema
const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: true },
    messageType: { type: String, enum: ['text', 'emotion', 'mood_image'], default: 'text' },
    emotionData: {
        emotion: String,
        confidence: Number
    },
    imageUrl: String,
    timestamp: { type: Date, default: Date.now },
    isPrivate: { type: Boolean, default: true }
});

const Message = mongoose.model('Message', messageSchema);

// File upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

// JWT middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Routes
// Register
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();

        // Generate token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Update online status
        user.isOnline = true;
        await user.save();

        // Generate token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get online users
app.get('/api/users/online', authenticateToken, async (req, res) => {
    try {
        const users = await User.find({ isOnline: true, _id: { $ne: req.user.userId } })
            .select('username profilePicture lastSeen');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update profile
app.put('/api/profile', authenticateToken, async (req, res) => {
    try {
        const { username } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { username },
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Upload profile picture
app.post('/api/profile/picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { profilePicture: `/uploads/${req.file.filename}` },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get messages
app.get('/api/messages/:receiverId', authenticateToken, async (req, res) => {
    try {
        const { receiverId } = req.params;
        const messages = await Message.find({
            $or: [
                { sender: req.user.userId, receiver: receiverId },
                { sender: receiverId, receiver: req.user.userId }
            ]
        }).populate('sender', 'username profilePicture')
          .populate('receiver', 'username profilePicture')
          .sort({ timestamp: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get self messages (Talk to yourself)
app.get('/api/messages/self', authenticateToken, async (req, res) => {
    try {
        const messages = await Message.find({
            sender: req.user.userId,
            receiver: req.user.userId
        }).populate('sender', 'username profilePicture')
          .sort({ timestamp: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Logout
app.post('/api/logout', authenticateToken, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.userId, { 
            isOnline: false, 
            lastSeen: new Date() 
        });
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Socket.IO connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User joins
    socket.on('user_join', async (userData) => {
        try {
            connectedUsers.set(socket.id, userData);
            
            // Update user online status
            await User.findByIdAndUpdate(userData.userId, { isOnline: true });
            
            // Broadcast to all users that someone came online
            socket.broadcast.emit('user_online', userData);
            
            // Send current online users to the new user
            const onlineUsers = await User.find({ isOnline: true })
                .select('username profilePicture lastSeen');
            socket.emit('online_users', onlineUsers);
        } catch (error) {
            console.error('Error in user_join:', error);
        }
    });

    // Handle private messages
    socket.on('private_message', async (data, callback) => {
        try {
            const { receiverId, content, messageType, emotionData, imageUrl } = data;
            const senderData = connectedUsers.get(socket.id);

            if (!senderData) {
                if (callback) callback({ error: 'User not found' });
                return;
            }

            // Save message to database
            const message = new Message({
                sender: senderData.userId,
                receiver: receiverId,
                content,
                messageType: messageType || 'text',
                emotionData,
                imageUrl,
                isPrivate: true
            });

            await message.save();
            await message.populate('sender', 'username profilePicture');
            await message.populate('receiver', 'username profilePicture');

            // Send to receiver if online
            const receiverSocketId = Array.from(connectedUsers.entries())
                .find(([id, user]) => user.userId === receiverId)?.[0];

            if (receiverSocketId) {
                io.to(receiverSocketId).emit('new_message', message);
            }

            // Send back to sender
            socket.emit('message_sent', message);
            
            // Acknowledge success
            if (callback) callback({ success: true });
        } catch (error) {
            console.error('Error in private_message:', error);
            socket.emit('message_error', { error: 'Failed to send message' });
            if (callback) callback({ error: 'Failed to send message' });
        }
    });

    // Handle self messages (Talk to yourself)
    socket.on('self_message', async (data, callback) => {
        try {
            const { content, messageType, emotionData, imageUrl } = data;
            const senderData = connectedUsers.get(socket.id);

            if (!senderData) {
                if (callback) callback({ error: 'User not found' });
                return;
            }

            // Save message to database
            const message = new Message({
                sender: senderData.userId,
                receiver: senderData.userId,
                content,
                messageType: messageType || 'text',
                emotionData,
                imageUrl,
                isPrivate: true
            });

            await message.save();
            await message.populate('sender', 'username profilePicture');

            // Send back to sender
            socket.emit('new_message', message);
            
            // Acknowledge success
            if (callback) callback({ success: true });
        } catch (error) {
            console.error('Error in self_message:', error);
            socket.emit('message_error', { error: 'Failed to send message' });
            if (callback) callback({ error: 'Failed to send message' });
        }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
        const { receiverId, isTyping } = data;
        const senderData = connectedUsers.get(socket.id);

        if (!senderData) return;

        const receiverSocketId = Array.from(connectedUsers.entries())
            .find(([id, user]) => user.userId === receiverId)?.[0];

        if (receiverSocketId) {
            io.to(receiverSocketId).emit('user_typing', {
                userId: senderData.userId,
                username: senderData.username,
                isTyping
            });
        }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
        try {
            const userData = connectedUsers.get(socket.id);
            if (userData) {
                // Update user offline status
                await User.findByIdAndUpdate(userData.userId, { 
                    isOnline: false, 
                    lastSeen: new Date() 
                });

                // Broadcast to all users that someone went offline
                socket.broadcast.emit('user_offline', userData);
                
                connectedUsers.delete(socket.id);
            }
        } catch (error) {
            console.error('Error in disconnect:', error);
        }
        console.log('User disconnected:', socket.id);
    });
});

// Serve static files
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});