⚡ Real Time Communication App
🚀 SyncSpace — Real-time Video Conferencing & Collaboration Platform

JavaScript React Node.js MongoDB Socket.io TailwindCSS WebRTC JWT

📌 About The Project
SyncSpace is a production-ready full-stack real-time communication web application that enables teams to meet, communicate, and collaborate from anywhere in the world.

SyncSpace means Synchronized Space — a shared virtual place where everything syncs instantly between all users in real-time.

This project demonstrates the use of modern web technologies like WebRTC for peer-to-peer video communication, Socket.io for real-time data exchange, and React.js for a responsive user interface.

✨ Features
Feature	Description
📹 Multi-user Video Calling	HD video calls using WebRTC P2P technology
🖥️ Screen Sharing	Share your screen instantly with all participants
💬 Real-time Chat	Instant messaging inside meeting rooms
📎 File Sharing	Upload and share files inside meetings
🖊️ Collaborative Whiteboard	Draw together synced in real-time
🔐 User Authentication	Secure login and signup with JWT tokens
🚪 Room System	Create unique room ID and share with others
🔒 Data Encryption	Secured with bcrypt, JWT, and TLS
📱 Responsive UI	Works on mobile, tablet, and desktop
🎙️ Media Controls	Mute, unmute, camera toggle, leave meeting
🛠️ Tech Stack
Frontend
React TailwindCSS Socket.io WebRTC Axios

Technology	Purpose
React.js	UI Framework
Tailwind CSS	Styling
Socket.io Client	Real-time Events
WebRTC APIs	Video and Audio P2P
Axios	API Calls
React Router	Navigation
Backend
Node.js Express MongoDB JWT

Technology	Purpose
Node.js	Runtime Environment
Express.js	Web Framework
MongoDB	Database
Socket.io	Real-time Communication
JWT	Authentication
bcryptjs	Password Encryption
Multer	File Uploads
Helmet	Security Headers
📁 Project Structure
syncspace/
├── 📂 client/                      # React Frontend (24 files)
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── App.js
│       ├── index.js
│       ├── index.css
│       ├── context/
│       │   ├── AuthContext.js
│       │   └── SocketContext.js
│       ├── hooks/
│       │   ├── useWebRTC.js
│       │   ├── useChat.js
│       │   └── useWhiteboard.js
│       ├── pages/
│       │   ├── LandingPage.js
│       │   ├── AuthPage.js
│       │   ├── DashboardPage.js
│       │   └── RoomPage.js
│       └── components/
│           ├── VideoGrid/
│           │   ├── VideoGrid.js
│           │   └── VideoTile.js
│           ├── Room/
│           │   ├── ControlBar.js
│           │   └── RoomHeader.js
│           ├── Chat/
│           │   └── ChatPanel.js
│           ├── Whiteboard/
│           │   └── Whiteboard.js
│           └── UI/
│               └── LoadingSpinner.js
│
└── 📂 server/                      # Node.js Backend (10 files)
    ├── index.js
    ├── package.json
    ├── socket/
    │   └── socketHandlers.js
    ├── routes/
    │   ├── auth.js
    │   ├── rooms.js
    │   └── files.js
    ├── models/
    │   ├── User.js
    │   └── Room.js
    └── middleware/
        └── auth.js
🚀 Setup Instructions
Prerequisites
Node.js v18+
MongoDB
npm v9+
1️⃣ Clone Repository
git clone https://github.com/YOUR_USERNAME/Syncspace.git
cd Syncspace
2️⃣ Install Dependencies
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
3️⃣ Configure Environment Variables
server/.env

PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/syncspace
JWT_SECRET=your_secret_key_min_32_chars
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
MAX_FILE_SIZE=52428800
client/.env

REACT_APP_SERVER_URL=http://localhost:5000
REACT_APP_STUN_SERVER=stun:stun.l.google.com:19302
4️⃣ Run Application
# Terminal 1 - Start Backend
cd server
npm run dev
# Server runs on http://localhost:5000

# Terminal 2 - Start Frontend
cd client
npm start
# App runs on http://localhost:3000
⚡ How WebRTC Signaling Works
New User Joins Room
        ↓
Server sends existing peers list to new user
        ↓
New user creates RTCPeerConnection for each peer
        ↓
New user sends SDP Offer to each peer via Socket.io
        ↓
Each peer receives offer and sends SDP Answer
        ↓
Both sides exchange ICE Candidates via Socket.io
        ↓
✅ P2P Connection Established!
Video and Audio flows directly between users
No server involvement after this point!
🔒 Security Features
Feature	Implementation
Password Hashing	bcryptjs 12 rounds
Authentication	JWT 7 day expiry
Rate Limiting	100 requests per 15 min
HTTP Headers	Helmet.js
File Validation	Block dangerous file types
CORS	Restricted to frontend URL
📡 API Reference
Authentication
Method	Endpoint	Description
POST	/api/auth/register	Create new account
POST	/api/auth/login	Login and get token
GET	/api/auth/me	Get current user
Rooms
Method	Endpoint	Description
POST	/api/rooms/create	Create new room
GET	/api/rooms/:roomId	Get room info
Files
Method	Endpoint	Description
POST	/api/files/upload/:roomId	Upload file
📊 Project Stats
Category	Count
🖥️ Frontend Files	24
🗄️ Backend Files	10
📁 Root Files	3
✅ Total Files	37
✨ Total Features	10
📝 Lines of Code	~4500
📄 License
This project is licensed under the MIT License — free to use and modify!

⭐ If you like this project, give it a star! ⭐
