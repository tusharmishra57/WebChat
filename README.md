# ChatApp - Real-time Chat Application with Emotion Detection

A modern, responsive chat application built with Node.js, Express, Socket.IO, and MongoDB. Features include real-time messaging, emotion detection, mood filters, and mobile-optimized design.

## Features

- 🔐 **User Authentication** - Secure login and registration
- 💬 **Real-time Chat** - Instant messaging with Socket.IO
- 👥 **Online Users** - See who's currently online
- 🤔 **Talk to Yourself** - Private space for personal thoughts
- 😊 **Emotion Detection** - AI-powered emotion recognition via camera
- 🎨 **Mood Filters** - Apply Ghibli-style filters to captured images
- 👤 **Profile Management** - Update profile picture and username
- 📱 **Mobile Responsive** - Optimized for smartphone usage
- 🌙 **Dark Mode Support** - Automatic dark/light theme detection

## Tech Stack

- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Frontend**: Vanilla JavaScript, CSS3, HTML5
- **Real-time Communication**: WebSockets via Socket.IO

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Modern web browser with camera support

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Website2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Update the following variables:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/chatapp
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=development
   
   # API Keys (add when available)
   EMOTION_API_KEY=your-emotion-api-key
   MOOD_FILTER_API_KEY=your-mood-filter-api-key
   ```

4. **Start MongoDB**
   - Make sure MongoDB is running on your system
   - Or use MongoDB Atlas for cloud database

5. **Run the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   - Open your browser and go to `http://localhost:3000`

## API Integration

### Emotion Detection API
The app is prepared for emotion detection API integration. To enable:

1. Get an API key from your emotion detection service
2. Update `EMOTION_API_KEY` in `.env`
3. Modify `public/js/camera.js` - update the `callEmotionAPI` method
4. Set `isEmotionAPIEnabled = true` in the CameraController

### Mood Filter API
The app is prepared for mood filter API integration. To enable:

1. Get an API key from your image filter service
2. Update `MOOD_FILTER_API_KEY` in `.env`
3. Modify `public/js/camera.js` - update the `callMoodFilterAPI` method
4. Set `isMoodAPIEnabled = true` in the CameraController

## Project Structure

```
Website2/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
├── public/                # Static files
│   ├── index.html         # Main HTML file
│   ├── css/
│   │   └── style.css      # Responsive styles
│   ├── js/
│   │   ├── app.js         # Main application logic
│   │   ├── auth.js        # Authentication handling
│   │   ├── chat.js        # Chat functionality
│   │   ├── camera.js      # Camera and API integration
│   │   └── utils.js       # Utility functions
│   └── images/
│       └── default-avatar.* # Default user avatar
└── uploads/               # User uploaded files
```

## Usage

### Getting Started
1. **Register** a new account or **login** with existing credentials
2. **Home Page** shows all online users
3. **Click on a user** to start chatting
4. **Use "Talk to Yourself"** for private notes

### Chat Features
- **Send Messages**: Type and press Enter or click send
- **Emotion Detection**: Click the smile icon to detect your emotion
- **Mood Filter**: Click the camera icon to apply filters to your image
- **Real-time Updates**: See when others are typing

### Profile Management
- **Click your profile** in the header to access settings
- **Change Username**: Update your display name
- **Upload Profile Picture**: Click the camera icon on your avatar
- **Logout**: Securely end your session

## Mobile Usage

The app is optimized for mobile devices:
- **Touch-friendly interface**
- **Responsive design** adapts to screen size
- **Camera integration** works on mobile browsers
- **Swipe gestures** for navigation
- **Optimized performance** for mobile networks

## Deployment

### Option 1: Heroku Deployment

1. **Install Heroku CLI**
2. **Create Heroku app**
   ```bash
   heroku create your-app-name
   ```

3. **Set environment variables**
   ```bash
   heroku config:set MONGODB_URI=your-mongodb-atlas-uri
   heroku config:set JWT_SECRET=your-jwt-secret
   heroku config:set NODE_ENV=production
   ```

4. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

### Option 2: Railway Deployment

1. **Connect GitHub repository** to Railway
2. **Set environment variables** in Railway dashboard
3. **Deploy automatically** on git push

### Option 3: Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set environment variables** in Vercel dashboard

### Option 4: DigitalOcean App Platform

1. **Create new app** in DigitalOcean
2. **Connect GitHub repository**
3. **Configure environment variables**
4. **Deploy**

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `NODE_ENV` | Environment (development/production) | No |
| `EMOTION_API_KEY` | Emotion detection API key | No |
| `MOOD_FILTER_API_KEY` | Mood filter API key | No |

## Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation for all inputs
- **File Upload Security**: Restricted file types and sizes
- **CORS Protection**: Configured for secure cross-origin requests

## Browser Support

- **Chrome** 60+ (recommended for camera features)
- **Firefox** 55+
- **Safari** 11+
- **Edge** 79+
- **Mobile browsers** with camera support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

## Roadmap

- [ ] Voice messages
- [ ] File sharing
- [ ] Group chats
- [ ] Message encryption
- [ ] Push notifications
- [ ] Advanced emotion analytics
- [ ] More filter options
- [ ] Themes customization