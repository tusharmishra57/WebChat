#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🚀 ChatApp MongoDB Setup Script');
console.log('=================================\n');

async function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function setupEnvironment() {
    const envPath = path.join(__dirname, '.env');
    
    if (fs.existsSync(envPath)) {
        console.log('✅ .env file already exists');
        const overwrite = await askQuestion('Do you want to overwrite it? (y/N): ');
        if (overwrite.toLowerCase() !== 'y') {
            console.log('Setup cancelled. Existing .env file preserved.');
            rl.close();
            return;
        }
    }

    console.log('\n📋 Choose your MongoDB setup:');
    console.log('1. MongoDB Atlas (Cloud) - Recommended');
    console.log('2. Local MongoDB Installation');
    console.log('3. Demo Mode (No Database)');
    
    const choice = await askQuestion('\nEnter your choice (1-3): ');
    
    let mongoUri = '';
    let envContent = '';
    
    switch (choice) {
        case '1':
            console.log('\n🌐 MongoDB Atlas Setup');
            console.log('Please follow these steps:');
            console.log('1. Go to: https://www.mongodb.com/atlas/database');
            console.log('2. Create a free account and cluster');
            console.log('3. Create a database user');
            console.log('4. Get your connection string\n');
            
            mongoUri = await askQuestion('Enter your MongoDB Atlas connection string: ');
            if (!mongoUri.includes('mongodb+srv://')) {
                console.log('⚠️  Warning: This doesn\'t look like an Atlas connection string');
            }
            break;
            
        case '2':
            console.log('\n🖥️  Local MongoDB Setup');
            mongoUri = 'mongodb://localhost:27017/chatapp';
            console.log('Using local MongoDB connection');
            break;
            
        case '3':
            console.log('\n🎮 Demo Mode Selected');
            console.log('You can run: npm run start-demo');
            mongoUri = 'mongodb://localhost:27017/chatapp';
            break;
            
        default:
            console.log('Invalid choice. Using local MongoDB as default.');
            mongoUri = 'mongodb://localhost:27017/chatapp';
    }
    
    const jwtSecret = `chatapp-secret-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    envContent = `# ChatApp Environment Variables
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=${mongoUri}

# Security
JWT_SECRET=${jwtSecret}

# API Keys (Add when you integrate real APIs)
EMOTION_API_KEY=your-emotion-api-key-here
MOOD_FILTER_API_KEY=your-mood-filter-api-key-here
`;

    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file created successfully');
    
    // Check uploads directory
    const uploadsPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsPath)) {
        fs.mkdirSync(uploadsPath, { recursive: true });
        console.log('✅ uploads directory created');
    }
    
    console.log('\n🎉 Setup Complete!');
    console.log('==================');
    
    if (choice === '1') {
        console.log('📖 Next steps for MongoDB Atlas:');
        console.log('1. Make sure your connection string is correct');
        console.log('2. Whitelist your IP address in Atlas');
        console.log('3. Run: npm start');
    } else if (choice === '2') {
        console.log('📖 Next steps for Local MongoDB:');
        console.log('1. Install MongoDB: https://www.mongodb.com/try/download/community');
        console.log('2. Start MongoDB service');
        console.log('3. Run: npm start');
    } else {
        console.log('📖 Next steps for Demo Mode:');
        console.log('1. Run: npm run start-demo (for in-memory storage)');
        console.log('2. Or set up MongoDB and run: npm start');
    }
    
    console.log('\n🌐 Your app will be available at: http://localhost:3000');
    console.log('📱 For mobile: http://YOUR_IP_ADDRESS:3000');
    
    rl.close();
}

setupEnvironment().catch(console.error);