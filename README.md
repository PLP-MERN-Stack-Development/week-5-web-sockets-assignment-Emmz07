
# Real-Time Chat Application

## Project Overview
This project is a full-stack real-time chat application built with React, Node.js, Express, and Socket.io. It supports global and private messaging, multiple chat rooms, file/image sharing, message reactions, read receipts, notifications, and more. The app demonstrates modern real-time web communication features.

## Features Implemented
- **User Authentication** (username-based, with JWT option)
- **Global and Private Messaging**
- **Multiple Chat Rooms/Channels** (create, join, leave)
- **Online/Offline User Status**
- **Typing Indicators** (per room)
- **File/Image Sharing** (upload and display)
- **Message Reactions** (like, love, etc.)
- **Read Receipts**
- **Message Delivery Acknowledgment**
- **Message Pagination and Search**
- **Unread Message Counts**
- **Real-Time Notifications** (in-app, sound, browser)
- **Responsive UI**
- **Reconnection Logic**
- **Performance Optimizations** (Socket.io rooms, efficient state management)

## Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- npm

### 1. Clone the Repository
```sh
git clone https://github.com/PLP-MERN-Stack-Development/week-5-web-sockets-assignment-Emmz07.git
cd week-5-web-sockets-assignment-Emmz07
```

### 2. Install Server Dependencies
```sh
cd server
npm install
```

### 3. Install Client Dependencies
```sh
cd ../client
npm install
```

### 4. Start the Server
```sh
cd ../server
node server.js
```

### 5. Start the Client (in a new terminal)
```sh
cd ../client
npm run dev
```

### 6. Open the App
Visit [http://localhost:5173](http://localhost:5173) in your browser.

## Screenshots

### Chat Room UI
![Chat Room Screenshot](./screenshots/chat-room.png)

### Room Selector
![Room Selector Screenshot](./screenshots/room-selector.png)

### File/Image Sharing
![File Sharing Screenshot](./screenshots/file-sharing.png)


## License
MIT