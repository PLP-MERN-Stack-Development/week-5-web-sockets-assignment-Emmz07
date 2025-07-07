// server.js - Main server file for Socket.io chat application

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const upload = multer({ dest: path.join(__dirname, 'public', 'uploads') });

// In-memory stores
const users = {}; // { socketId: { username, id, online, rooms: [] } }
const messages = {}; // { room: [msg, ...] }
const typingUsers = {}; // { room: { socketId: username } }
const rooms = ['global']; // Default room
const unreadCounts = {}; // { userId: { room: count } }

// Helper: Authenticate user (username-based or JWT)
function authenticate(socket, data, cb) {
  if (data.token) {
    try {
      const decoded = jwt.verify(data.token, JWT_SECRET);
      cb(null, decoded.username);
    } catch (e) {
      cb('Invalid token');
    }
  } else if (data.username) {
    cb(null, data.username);
  } else {
    cb('No username or token');
  }
}

// Helper: Send unread counts
function sendUnreadCounts(socket) {
  const user = users[socket.id];
  if (!user) return;
  socket.emit('unread_counts', unreadCounts[user.id] || {});
}

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User authentication (username or JWT)
  socket.on('authenticate', (data, cb) => {
    authenticate(socket, data, (err, username) => {
      if (err) return cb && cb({ error: err });
      users[socket.id] = { username, id: socket.id, online: true, rooms: ['global'] };
      socket.join('global');
      io.emit('user_list', Object.values(users));
      io.emit('user_joined', { username, id: socket.id });
      cb && cb({ success: true, token: jwt.sign({ username }, JWT_SECRET) });
    });
  });

  // Join room
  socket.on('join_room', (room) => {
    if (!rooms.includes(room)) rooms.push(room);
    users[socket.id].rooms.push(room);
    socket.join(room);
    socket.emit('room_joined', room);
    io.to(room).emit('user_list', Object.values(users).filter(u => u.rooms.includes(room)));
  });

  // Leave room
  socket.on('leave_room', (room) => {
    socket.leave(room);
    users[socket.id].rooms = users[socket.id].rooms.filter(r => r !== room);
    io.to(room).emit('user_list', Object.values(users).filter(u => u.rooms.includes(room)));
  });

  // Send message (global or room)
  socket.on('send_message', (data, cb) => {
    const room = data.room || 'global';
    const message = {
      ...data,
      id: Date.now() + Math.random(),
      sender: users[socket.id]?.username || 'Anonymous',
      senderId: socket.id,
      timestamp: new Date().toISOString(),
      room,
      reactions: {},
      readBy: [socket.id],
      delivered: true,
    };
    if (!messages[room]) messages[room] = [];
    messages[room].push(message);
    if (messages[room].length > 100) messages[room].shift();
    io.to(room).emit('receive_message', message);
    // Unread count for others
    Object.keys(users).forEach(uid => {
      if (uid !== socket.id && users[uid].rooms.includes(room)) {
        if (!unreadCounts[uid]) unreadCounts[uid] = {};
        unreadCounts[uid][room] = (unreadCounts[uid][room] || 0) + 1;
        io.to(uid).emit('unread_counts', unreadCounts[uid]);
      }
    });
    cb && cb({ delivered: true, id: message.id });
  });

  // Private message
  socket.on('private_message', ({ to, message }, cb) => {
    const messageData = {
      id: Date.now() + Math.random(),
      sender: users[socket.id]?.username || 'Anonymous',
      senderId: socket.id,
      message,
      timestamp: new Date().toISOString(),
      isPrivate: true,
      readBy: [socket.id],
      reactions: {},
      delivered: true,
    };
    socket.to(to).emit('private_message', messageData);
    socket.emit('private_message', messageData);
    cb && cb({ delivered: true, id: messageData.id });
  });

  // Typing indicator (per room)
  socket.on('typing', ({ room = 'global', isTyping }) => {
    if (!typingUsers[room]) typingUsers[room] = {};
    if (isTyping) {
      typingUsers[room][socket.id] = users[socket.id]?.username;
    } else {
      delete typingUsers[room][socket.id];
    }
    io.to(room).emit('typing_users', Object.values(typingUsers[room]));
  });

  // Read receipt
  socket.on('read_message', ({ room = 'global', messageId }) => {
    if (!messages[room]) return;
    const msg = messages[room].find(m => m.id === messageId);
    if (msg && !msg.readBy.includes(socket.id)) {
      msg.readBy.push(socket.id);
      io.to(room).emit('message_read', { messageId, userId: socket.id });
      // Reset unread count
      if (unreadCounts[socket.id]) unreadCounts[socket.id][room] = 0;
      sendUnreadCounts(socket);
    }
  });

  // Message reaction
  socket.on('react_message', ({ room = 'global', messageId, reaction }) => {
    if (!messages[room]) return;
    const msg = messages[room].find(m => m.id === messageId);
    if (msg) {
      msg.reactions[reaction] = (msg.reactions[reaction] || 0) + 1;
      io.to(room).emit('message_reaction', { messageId, reaction, count: msg.reactions[reaction] });
    }
  });

  // File/image sharing (base64 or URL)
  socket.on('send_file', ({ room = 'global', file, filename, type }, cb) => {
    // For demo: just broadcast file meta (in production, save file and send URL)
    const message = {
      id: Date.now() + Math.random(),
      sender: users[socket.id]?.username || 'Anonymous',
      senderId: socket.id,
      timestamp: new Date().toISOString(),
      room,
      file: { filename, type, data: file },
      isFile: true,
      reactions: {},
      readBy: [socket.id],
      delivered: true,
    };
    if (!messages[room]) messages[room] = [];
    messages[room].push(message);
    io.to(room).emit('receive_message', message);
    cb && cb({ delivered: true, id: message.id });
  });

  // Message pagination
  socket.on('get_messages', ({ room = 'global', page = 1, pageSize = 20 }, cb) => {
    if (!messages[room]) messages[room] = [];
    const total = messages[room].length;
    const start = Math.max(0, total - page * pageSize);
    const end = total - (page - 1) * pageSize;
    const paged = messages[room].slice(start, end);
    cb && cb({ messages: paged, total });
  });

  // Message search
  socket.on('search_messages', ({ room = 'global', query }, cb) => {
    if (!messages[room]) messages[room] = [];
    const found = messages[room].filter(m => m.message && m.message.includes(query));
    cb && cb({ messages: found });
  });

  // Delivery acknowledgment
  socket.on('ack_message', ({ room = 'global', messageId }) => {
    // For demo: just emit ack
    io.to(room).emit('message_ack', { messageId, userId: socket.id });
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (users[socket.id]) {
      users[socket.id].online = false;
      const { username } = users[socket.id];
      io.emit('user_left', { username, id: socket.id });
    }
    delete users[socket.id];
    Object.keys(typingUsers).forEach(room => delete typingUsers[room][socket.id]);
    io.emit('user_list', Object.values(users));
    Object.keys(unreadCounts).forEach(uid => {
      if (unreadCounts[uid][socket.id]) delete unreadCounts[uid][socket.id];
    });
  });
});

// REST API for file upload
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.originalname });
});

// API: Get rooms
app.get('/api/rooms', (req, res) => {
  res.json(rooms);
});

// API: Get users
app.get('/api/users', (req, res) => {
  res.json(Object.values(users));
});

// API: Get messages (paginated)
app.get('/api/messages/:room', (req, res) => {
  const { room } = req.params;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  if (!messages[room]) messages[room] = [];
  const total = messages[room].length;
  const start = Math.max(0, total - page * pageSize);
  const end = total - (page - 1) * pageSize;
  const paged = messages[room].slice(start, end);
  res.json({ messages: paged, total });
});

// Root route
app.get('/', (req, res) => {
  res.send('Socket.io Chat Server is running');
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };