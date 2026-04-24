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
