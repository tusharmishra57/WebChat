# 🗄️ MongoDB Setup Guide for ChatApp

## 🌟 **OPTION 1: MongoDB Atlas (Cloud) - RECOMMENDED**

### **Step 1: Create MongoDB Atlas Account**
1. Go to: https://www.mongodb.com/atlas/database
2. Click **"Try Free"**
3. Sign up with your email or Google account
4. Verify your email address

### **Step 2: Create a Free Cluster**
1. **Choose deployment type:** Select **"Shared"** (Free tier)
2. **Cloud Provider:** Choose **AWS** (recommended)
3. **Region:** Choose closest to your location
4. **Cluster Name:** Keep default or name it `chatapp-cluster`
5. Click **"Create Cluster"** (takes 3-5 minutes)

### **Step 3: Create Database User**
1. Go to **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. **Authentication Method:** Password
4. **Username:** `chatapp-user` (or your choice)
5. **Password:** Generate secure password (save it!)
6. **Database User Privileges:** Select **"Read and write to any database"**
7. Click **"Add User"**

### **Step 4: Configure Network Access**
1. Go to **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. **For development:** Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. **For production:** Add your specific IP addresses
5. Click **"Confirm"**

### **Step 5: Get Connection String**
1. Go to **"Database"** in left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. **Driver:** Node.js
5. **Version:** 4.1 or later
6. **Copy the connection string** - it looks like:
   ```
   mongodb+srv://chatapp-user:<password>@chatapp-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. **Replace `<password>`** with your actual password

### **Step 6: Configure Your ChatApp**
1. **Create/Update .env file** in your project root:
   ```env
   PORT=3000
   MONGODB_URI=mongodb+srv://chatapp-user:YOUR_PASSWORD@chatapp-cluster.xxxxx.mongodb.net/chatapp?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=development
   
   # API Keys (for later)
   EMOTION_API_KEY=your-emotion-api-key
   MOOD_FILTER_API_KEY=your-mood-filter-api-key
   ```

2. **Replace in the connection string:**
   - `YOUR_PASSWORD` with your database user password
   - Add `/chatapp` before the `?` to specify database name

### **Step 7: Test Connection**
```bash
npm start
```

You should see:
```
✅ Connected to MongoDB successfully
🗄️ Database: Ready for persistent storage
```

---

## 🖥️ **OPTION 2: Local MongoDB Installation**

### **For Windows:**

#### **Step 1: Download MongoDB**
1. Go to: https://www.mongodb.com/try/download/community
2. **Version:** Select latest version
3. **Platform:** Windows
4. **Package:** MSI
5. Click **"Download"**

#### **Step 2: Install MongoDB**
1. Run the downloaded `.msi` file
2. Choose **"Complete"** installation
3. **Install MongoDB as a Service:** ✅ Check this
4. **Service Name:** MongoDB
5. **Install MongoDB Compass:** ✅ Check this (GUI tool)
6. Click **"Install"**

#### **Step 3: Start MongoDB Service**
1. **Option A - Automatic:** Service should start automatically
2. **Option B - Manual:** 
   - Open **Services** (Windows + R, type `services.msc`)
   - Find **"MongoDB"** service
   - Right-click → **"Start"**

#### **Step 4: Verify Installation**
1. Open **Command Prompt** as Administrator
2. Run: `mongosh` (or `mongo` for older versions)
3. You should see MongoDB shell

#### **Step 5: Configure ChatApp**
1. **Create/Update .env file:**
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/chatapp
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=development
   ```

2. **Test connection:**
   ```bash
   npm start
   ```

### **For macOS:**

#### **Using Homebrew (Recommended):**
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community

# Create .env file with local connection
echo "MONGODB_URI=mongodb://localhost:27017/chatapp" >> .env
```

### **For Linux (Ubuntu/Debian):**
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package list
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Create .env file
echo "MONGODB_URI=mongodb://localhost:27017/chatapp" >> .env
```

---

## 🧪 **Testing Your Setup**

### **1. Start Your ChatApp**
```bash
npm start
```

### **2. Expected Output:**
```
🚀 ChatApp Server Starting with MongoDB...
💾 Connecting to database...

✅ Connected to MongoDB successfully
🗄️ Database: Ready for persistent storage

✅ Server running on port 3000
🌐 Open your browser and go to: http://localhost:3000
```

### **3. Test Database Features:**
1. **Register a new user** - data should persist
2. **Login/Logout** - sessions should work
3. **Send messages** - should be saved to database
4. **Restart server** - data should still be there!

---

## 🔧 **Troubleshooting**

### **Common Issues:**

#### **1. Connection Timeout (Atlas)**
- ✅ Check your internet connection
- ✅ Verify IP address is whitelisted (0.0.0.0/0 for development)
- ✅ Check username/password in connection string

#### **2. Authentication Failed**
- ✅ Verify database user credentials
- ✅ Check password doesn't contain special characters that need encoding
- ✅ Ensure user has proper permissions

#### **3. Local MongoDB Won't Start**
- ✅ Check if MongoDB service is running
- ✅ Verify installation completed successfully
- ✅ Check port 27017 isn't blocked by firewall

#### **4. "Module not found" errors**
```bash
npm install
```

### **Connection String Examples:**

#### **Atlas (Cloud):**
```
mongodb+srv://username:password@cluster.xxxxx.mongodb.net/chatapp?retryWrites=true&w=majority
```

#### **Local:**
```
mongodb://localhost:27017/chatapp
```

#### **Local with Authentication:**
```
mongodb://username:password@localhost:27017/chatapp
```

---

## 🚀 **Next Steps After Setup**

1. **✅ Test all features** - registration, login, chat, profile
2. **🔒 Secure your setup** - change JWT_SECRET
3. **📊 Monitor usage** - check MongoDB Atlas dashboard
4. **🌐 Deploy to production** - your app is now database-ready!

---

## 💡 **Pro Tips**

### **For Development:**
- Use **MongoDB Atlas** for easy setup
- Enable **"Allow access from anywhere"** for development
- Use **MongoDB Compass** to view your data

### **For Production:**
- Restrict IP access to your server only
- Use strong passwords and JWT secrets
- Enable MongoDB authentication
- Set up database backups

### **Free Tier Limits (Atlas):**
- **Storage:** 512 MB
- **RAM:** Shared
- **Connections:** 500 concurrent
- **Perfect for:** Development and small apps

---

## 🎉 **You're Ready!**

Once you see the "✅ Connected to MongoDB successfully" message, your ChatApp is fully database-powered! All user data, messages, and profiles will now persist between server restarts.

**Your data will be stored in:**
- **Users collection:** User accounts and profiles
- **Messages collection:** All chat messages
- **Sessions:** Login sessions and tokens

Enjoy your fully-featured ChatApp with persistent data! 🚀