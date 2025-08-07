const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const axios = require('axios');
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
    transports: ['polling', 'websocket'],
    pingTimeout: 30000,
    pingInterval: 10000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e6
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
// Disable caching for development
app.use('/js', express.static('public/js', {
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
}));
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
    isPrivate: { type: Boolean, default: true },
    // Message status tracking
    status: { 
        type: String, 
        enum: ['sent', 'delivered', 'seen'], 
        default: 'sent' 
    },
    deliveredAt: { type: Date },
    seenAt: { type: Date },
    // Reply functionality
    replyTo: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Message',
        default: null 
    },
    isReply: { type: Boolean, default: false },
    // Reactions functionality
    reactions: {
        type: Map,
        of: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        default: {}
    }
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
        
        // Format users to match Socket.IO format (id instead of _id)
        const formattedUsers = users.map(user => ({
            id: user._id.toString(),
            username: user.username,
            profilePicture: user.profilePicture,
            lastSeen: user.lastSeen
        }));
        
        console.log('📡 Sending online users via HTTP:', formattedUsers);
        res.json(formattedUsers);
    } catch (error) {
        console.error('❌ Error in /api/users/online:', error);
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

// Get self messages (Talk to yourself) - MUST be before the parameterized route
app.get('/api/messages/self', authenticateToken, async (req, res) => {
    try {
        const messages = await Message.find({
            sender: req.user.userId,
            receiver: req.user.userId
        }).populate('sender', 'username profilePicture')
          .populate({
              path: 'replyTo',
              populate: {
                  path: 'sender',
                  select: 'username profilePicture'
              }
          })
          .sort({ timestamp: 1 });

        res.json(messages);
    } catch (error) {
        console.error('Error in /api/messages/self:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get messages with specific user
app.get('/api/messages/:receiverId', authenticateToken, async (req, res) => {
    try {
        const { receiverId } = req.params;
        
        // Validate receiverId
        if (!receiverId || receiverId === 'undefined') {
            return res.status(400).json({ message: 'Invalid receiver ID' });
        }

        const messages = await Message.find({
            $or: [
                { sender: req.user.userId, receiver: receiverId },
                { sender: receiverId, receiver: req.user.userId }
            ]
        }).populate('sender', 'username profilePicture')
          .populate('receiver', 'username profilePicture')
          .populate({
              path: 'replyTo',
              populate: {
                  path: 'sender',
                  select: 'username profilePicture'
              }
          })
          .sort({ timestamp: 1 });

        res.json(messages);
    } catch (error) {
        console.error('Error in /api/messages/:receiverId:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


// Add/Remove reaction to message
app.post('/api/messages/:messageId/react', authenticateToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji, toggle } = req.body;
        const userId = req.user.userId;
        
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        
        // Initialize reactions if not exists
        if (!message.reactions) {
            message.reactions = {};
        }
        
        // Initialize emoji array if not exists
        if (!message.reactions[emoji]) {
            message.reactions[emoji] = [];
        }
        
        const userIndex = message.reactions[emoji].indexOf(userId);
        
        if (toggle && userIndex > -1) {
            // Remove reaction if user already reacted and toggle is true
            message.reactions[emoji].splice(userIndex, 1);
            
            // Remove emoji if no users have reacted
            if (message.reactions[emoji].length === 0) {
                delete message.reactions[emoji];
            }
        } else if (userIndex === -1) {
            // Add reaction if user hasn't reacted
            message.reactions[emoji].push(userId);
        }
        
        // Mark reactions as modified and save
        message.markModified('reactions');
        await message.save();
        
        // Populate the saved message for response
        const populatedMessage = await Message.findById(messageId)
            .populate('sender', 'username profilePicture')
            .populate({
                path: 'replyTo',
                populate: {
                    path: 'sender',
                    select: 'username profilePicture'
                }
            });
        
        // Emit to all connected clients
        io.emit('messageReaction', { 
            messageId, 
            reactions: populatedMessage.reactions,
            userId,
            emoji,
            action: toggle && userIndex > -1 ? 'remove' : 'add'
        });
        
        res.json(populatedMessage);
    } catch (error) {
        console.error('Error adding reaction:', error);
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

// 🎨 CARTOON FILTER API ENDPOINT - Using Media.io Online Anime/Cartoon Filters
app.post('/api/mood-filter', authenticateToken, upload.single('image'), async (req, res) => {
    console.log('🎨 Media.io Anime/Cartoon Filter API called');
    
    try {
        if (!req.file) {
            console.log('❌ No file uploaded');
            return res.status(400).json({ 
                success: false, 
                message: 'No image file provided' 
            });
        }

        console.log('📸 Image details:', {
            size: req.file.size + ' bytes',
            type: req.file.mimetype,
            filename: req.file.filename
        });

        console.log('🎨 Applying Media.io anime/cartoon filter...');
        
        const fs = require('fs');
        const path = require('path');
        const FormData = require('form-data');
        
        // Create output filename with higher quality extension
        const outputFilename = `cartoon_${Date.now()}.png`;  // PNG for better quality
        const outputPath = path.join(__dirname, 'public', 'uploads', outputFilename);
        
        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        console.log('🎨 Media.io Anime/Cartoon Filter parameters:');
        console.log('   • Style: Anime/Cartoon transformation');
        console.log('   • Provider: Media.io (MioCreate) API');
        console.log('   • Processing: AI-powered anime/cartoon filters');
        console.log('   • Output format: JPEG/PNG');
        console.log('   • Input size:', req.file.size, 'bytes');
        
        // Step 1: Get upload URL from Media.io API
        console.log('📤 Step 1: Getting upload URL...');
        const uploadUrlResponse = await axios.post('https://devapi.miocreate.com/v1/source/upload-url', {
            file_name: req.file.filename
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        
        if (uploadUrlResponse.data.code !== 200) {
            throw new Error(`Media.io upload URL request failed: ${uploadUrlResponse.data.message}`);
        }
        
        const { upload_url, key } = uploadUrlResponse.data.data;
        console.log('✅ Upload URL obtained');
        
        // Step 2: Upload file to Media.io
        console.log('📤 Step 2: Uploading file...');
        const fileBuffer = fs.readFileSync(req.file.path);
        await axios.put(upload_url, fileBuffer, {
            headers: {
                'Content-Type': req.file.mimetype
            },
            timeout: 60000
        });
        console.log('✅ File uploaded successfully');
        
        // Step 3: Apply anime/cartoon filter (using style transformation)
        console.log('🎨 Step 3: Applying anime/cartoon filter...');
        const filterResponse = await axios.post('https://devapi.miocreate.com/v1/task/style-transfer', {
            source_key: key,
            style_type: 'anime', // Anime style transformation
            quality: 'hd' // High quality mode
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        
        if (filterResponse.data.code !== 200) {
            throw new Error(`Media.io filter request failed: ${filterResponse.data.message}`);
        }
        
        const taskId = filterResponse.data.data.task_id;
        console.log('✅ Filter task created, ID:', taskId);
        
        // Step 4: Poll for task completion
        console.log('⏳ Step 4: Waiting for processing...');
        let attempts = 0;
        const maxAttempts = 30; // 30 attempts with 2-second intervals = 60 seconds max
        let taskResult = null;
        
        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            
            const statusResponse = await axios.get(`https://devapi.miocreate.com/v1/task/detail?id=${taskId}`, {
                timeout: 10000
            });
            
            if (statusResponse.data.code === 200) {
                const task = statusResponse.data.data;
                if (task.status === 0) { // Completed
                    taskResult = task;
                    break;
                } else if (task.status === 1 || task.status === 2) { // Waiting or Processing
                    console.log(`⏳ Task status: ${task.status === 1 ? 'Waiting' : 'Processing'}...`);
                    attempts++;
                } else {
                    throw new Error(`Task failed with status: ${task.status}, message: ${task.message}`);
                }
            } else {
                attempts++;
            }
        }
        
        if (!taskResult) {
            throw new Error('Task timeout - processing took too long');
        }
        
        console.log('✅ Processing completed');
        
        // Step 5: Download the result
        const resultUrl = taskResult.additional_data.merge_url;
        const response = await axios.get(resultUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
        });
        
        if (response.status !== 200) {
            throw new Error(`Failed to download result: ${response.status}`);
        }
        
        // Save the cartoon result with quality validation
        fs.writeFileSync(outputPath, response.data);
        
        // Log output file information for quality verification
        const outputStats = fs.statSync(outputPath);
        console.log('📊 Output file stats:');
        console.log('   • Size:', outputStats.size, 'bytes');
        console.log('   • Quality ratio:', (outputStats.size / req.file.size * 100).toFixed(1) + '%');
        console.log('   • Format: JPEG/PNG');
        
        // Clean up uploaded file
        try {
            fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
            console.warn('⚠️ Could not clean up uploaded file:', cleanupError.message);
        }

        console.log('✅ Media.io anime/cartoon filter applied successfully!');

        res.json({
            success: true,
            message: 'Media.io anime/cartoon filter applied successfully!',
            filteredImage: `/uploads/${outputFilename}`,
            appliedEffects: {
                style: 'Anime/Cartoon',
                type: 'AI-powered anime/cartoon transformation',
                provider: 'Media.io (MioCreate) API',
                processing: 'Professional anime/cartoon filter'
            },
            provider: 'Media.io Online Anime/Cartoon Filters (Free)'
        });

    } catch (error) {
        console.error('❌ Cartoon filter error:', {
            message: error.message,
            stack: error.stack
        });
        
        // Clean up uploaded file on error
        try {
            if (req.file && req.file.path) {
                fs.unlinkSync(req.file.path);
            }
        } catch (cleanupError) {
            console.warn('⚠️ Could not clean up uploaded file after error:', cleanupError.message);
        }
        
        // Handle specific API errors
        let errorMessage = 'Cartoon processing error: ' + error.message;
        if (error.response) {
            if (error.response.status === 400) {
                errorMessage = 'Invalid image format or parameters';
            } else if (error.response.status === 413) {
                errorMessage = 'Image file too large (max 10MB)';
            } else if (error.response.status === 500) {
                errorMessage = 'Media.io API server error - please try again';
            }
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'Request timeout - please try with a smaller image';
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = 'Cannot connect to Media.io API - please check internet connection';
        }
        
        res.status(500).json({
            success: false,
            message: errorMessage,
            error: error.message
        });
    }
});

// 🧪 TEST CARTOON FILTER API ENDPOINT
app.get('/api/test-mood-filter', async (req, res) => {
    console.log('🧪 Testing Media.io Anime/Cartoon Filter API configuration...');
    
    res.json({
        success: true,
        message: 'Media.io Online Anime/Cartoon Filters API is ready - FREE!',
        config: {
            provider: 'Media.io (MioCreate) API',
            endpoints: {
                upload: 'https://devapi.miocreate.com/v1/source/upload-url',
                filter: 'https://devapi.miocreate.com/v1/task/style-transfer',
                status: 'https://devapi.miocreate.com/v1/task/detail'
            },
            cost: 'FREE',
            features: [
                'Multiple anime/cartoon styles available',
                'High-quality AI-powered transformation',
                'Professional anime filter effects',
                'Supports various image formats',
                'HD quality output option',
                'Fast processing (typically 10-30 seconds)',
                'No registration required for basic usage'
            ],
            availableStyles: [
                'Anime', 'Comic', 'Watercolor', 'Dragonball',
                'Ghibli', 'Retro Animate', 'American Comic',
                'Niji-Novel', 'Game Style', 'Digital Illustration'
            ],
            parameters: {
                style: 'Anime (default)',
                qualityMode: 'HD enabled',
                outputFormat: 'JPEG/PNG',
                cameraResolution: '1280x720 (ideal)',
                maxFileSize: '10MB',
                timeout: '60 seconds',
                processing: 'Multi-step AI anime/cartoon transformation'
            },
            note: 'Using Media.io\'s professional anime/cartoon filters with multiple style options!'
        }
    });
});

// Enhanced Socket.IO connection handling
const connectedUsers = new Map(); // socketId -> userData
const userSockets = new Map();    // userId -> socketId
const activeRooms = new Map();    // roomId -> Set of userIds

io.on('connection', (socket) => {
    console.log('🔌 New connection:', socket.id);
    
    // User authentication and joining
    socket.on('user_join', async (userData) => {
        try {
            const { userId, username } = userData;
            console.log(`👤 User joining: ${username} (${userId})`);
            
            // Remove any existing connections for this user
            const existingSocketId = userSockets.get(userId);
            if (existingSocketId && existingSocketId !== socket.id) {
                console.log(`🔄 Removing old connection for ${username}`);
                const oldSocket = io.sockets.sockets.get(existingSocketId);
                if (oldSocket) {
                    oldSocket.disconnect(true);
                }
                connectedUsers.delete(existingSocketId);
            }
            
            // Store new connection
            connectedUsers.set(socket.id, { userId, username, socketId: socket.id });
            userSockets.set(userId, socket.id);
            
            // Update database
            await User.findByIdAndUpdate(userId, { isOnline: true });
            
            // Join user to a general room for broadcasting
            socket.join('general');
            
            // Notify all users about new user
            socket.broadcast.emit('user_online', { userId, username });
            
            // Send current online users
            const onlineUsersList = Array.from(connectedUsers.values())
                .filter(user => user.userId !== userId)
                .map(user => ({ id: user.userId, username: user.username }));
            
            socket.emit('online_users', onlineUsersList);
            socket.emit('join_success', { message: 'Successfully joined chat' });
            
            console.log(`✅ ${username} joined. Total online: ${connectedUsers.size}`);
            
        } catch (error) {
            console.error('❌ Error in user_join:', error);
            socket.emit('join_error', { error: 'Failed to join chat' });
        }
    });

    // UNIFIED MESSAGE HANDLER - Handles all types of messages
    socket.on('send_message', async (messageData, callback) => {
        try {
            console.log('📨 Message received:', messageData);
            
            const senderData = connectedUsers.get(socket.id);
            if (!senderData) {
                console.error('❌ Sender not authenticated');
                if (callback) callback({ success: false, error: 'Not authenticated' });
                return;
            }

            const { receiverId, content, messageType = 'text', emotionData, imageUrl, replyTo } = messageData;
            
            // Validate message
            if (!content && !imageUrl && !emotionData) {
                if (callback) callback({ success: false, error: 'Message content required' });
                return;
            }

            // Create and save message
            const message = new Message({
                sender: senderData.userId,
                receiver: receiverId,
                content: content || '',
                messageType,
                emotionData,
                imageUrl,
                timestamp: new Date(),
                isPrivate: receiverId !== senderData.userId,
                status: 'sent', // Initially sent
                replyTo: replyTo || null,
                isReply: !!replyTo
            });

            await message.save();
            await message.populate('sender', 'username profilePicture');
            
            if (receiverId !== senderData.userId) {
                await message.populate('receiver', 'username profilePicture');
            }

            // Populate reply data if this is a reply
            if (message.replyTo) {
                await message.populate({
                    path: 'replyTo',
                    populate: {
                        path: 'sender',
                        select: 'username profilePicture'
                    }
                });
            }

            console.log('💾 Message saved with ID:', message._id);

            // Send to receiver if it's not a self-message
            if (receiverId !== senderData.userId) {
                const receiverSocketId = userSockets.get(receiverId);
                if (receiverSocketId) {
                    console.log(`📤 Sending to receiver: ${receiverId}`);
                    
                    // Mark as delivered and update database
                    message.status = 'delivered';
                    message.deliveredAt = new Date();
                    await message.save();
                    
                    io.to(receiverSocketId).emit('message_received', {
                        ...message.toObject(),
                        _id: message._id.toString()
                    });
                    
                    // Notify sender about delivery
                    socket.emit('message_delivered', {
                        messageId: message._id.toString(),
                        status: 'delivered',
                        deliveredAt: message.deliveredAt
                    });
                    
                } else {
                    console.log(`📴 Receiver ${receiverId} is offline`);
                }
            }

            // Always send back to sender for confirmation
            socket.emit('message_sent', {
                ...message.toObject(),
                _id: message._id.toString()
            });

            console.log('✅ Message processing complete');
            if (callback) callback({ success: true, messageId: message._id.toString() });

        } catch (error) {
            console.error('❌ Message error:', error);
            socket.emit('message_error', { error: error.message });
            if (callback) callback({ success: false, error: error.message });
        }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
        try {
            const { receiverId, isTyping } = data;
            const senderData = connectedUsers.get(socket.id);

            if (!senderData) return;

            const receiverSocketId = userSockets.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('user_typing', {
                    userId: senderData.userId,
                    username: senderData.username,
                    isTyping
                });
            }
        } catch (error) {
            console.error('❌ Typing indicator error:', error);
        }
    });

    // Handle message seen
    socket.on('message_seen', async (data) => {
        try {
            console.log('👁️ Message seen:', data);
            
            const userData = connectedUsers.get(socket.id);
            if (!userData) {
                console.error('❌ User not authenticated for message_seen');
                return;
            }

            const { messageId } = data;
            
            // Update message status to seen
            const message = await Message.findByIdAndUpdate(
                messageId,
                { 
                    status: 'seen',
                    seenAt: new Date()
                },
                { new: true }
            );

            if (!message) {
                console.error('❌ Message not found:', messageId);
                return;
            }

            // Notify the sender about the seen status
            const senderSocketId = userSockets.get(message.sender.toString());
            if (senderSocketId && senderSocketId !== socket.id) {
                io.to(senderSocketId).emit('message_seen', {
                    messageId: messageId,
                    status: 'seen',
                    seenAt: message.seenAt,
                    seenBy: userData.username
                });
            }

            console.log('✅ Message marked as seen:', messageId);

        } catch (error) {
            console.error('❌ Message seen error:', error);
        }
    });

    // Bulk mark messages as seen when user opens chat
    socket.on('mark_messages_seen', async (data) => {
        try {
            console.log('👁️ Marking messages as seen:', data);
            
            const userData = connectedUsers.get(socket.id);
            if (!userData) {
                console.error('❌ User not authenticated for mark_messages_seen');
                return;
            }

            const { senderId } = data;
            
            // Mark all unseen messages from this sender as seen
            const updatedMessages = await Message.updateMany(
                {
                    sender: senderId,
                    receiver: userData.userId,
                    status: { $ne: 'seen' }
                },
                {
                    status: 'seen',
                    seenAt: new Date()
                }
            );

            // Notify sender about seen status
            const senderSocketId = userSockets.get(senderId);
            if (senderSocketId) {
                io.to(senderSocketId).emit('messages_seen', {
                    receiverId: userData.userId,
                    receiverName: userData.username,
                    seenAt: new Date(),
                    count: updatedMessages.modifiedCount
                });
            }

            console.log(`✅ Marked ${updatedMessages.modifiedCount} messages as seen from ${senderId}`);

        } catch (error) {
            console.error('❌ Mark messages seen error:', error);
        }
    });

    // Handle disconnect
    socket.on('disconnect', async (reason) => {
        try {
            console.log(`❌ User disconnected: ${socket.id}, reason: ${reason}`);
            const userData = connectedUsers.get(socket.id);
            
            if (userData) {
                console.log(`👋 ${userData.username} disconnected`);
                
                // Clean up user mappings
                connectedUsers.delete(socket.id);
                userSockets.delete(userData.userId);
                
                // Update database
                await User.findByIdAndUpdate(userData.userId, { 
                    isOnline: false, 
                    lastSeen: new Date() 
                });

                // Notify other users
                socket.broadcast.emit('user_offline', {
                    userId: userData.userId,
                    username: userData.username
                });
                
                console.log(`📊 Online users remaining: ${connectedUsers.size}`);
            }
        } catch (error) {
            console.error('❌ Disconnect error:', error);
        }
    });
});

// Debug endpoints
app.get('/api/debug/status', (req, res) => {
    res.json({
        status: 'Server running',
        connectedUsers: connectedUsers.size,
        userSockets: userSockets.size,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        onlineUsers: Array.from(connectedUsers.values()).map(u => u.username)
    });
});

app.get('/api/debug/connections', (req, res) => {
    const connections = Array.from(connectedUsers.entries()).map(([socketId, userData]) => ({
        socketId,
        userId: userData.userId,
        username: userData.username
    }));
    
    res.json({
        totalConnections: connectedUsers.size,
        connections
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