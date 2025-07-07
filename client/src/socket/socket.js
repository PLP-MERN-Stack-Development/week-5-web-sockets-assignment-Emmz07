// socket.js - Socket.io client setup

import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

// Socket.io connection URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Create socket instance
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Custom hook for using socket.io
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastMessage, setLastMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [rooms, setRooms] = useState(['global']);
  const [currentRoom, setCurrentRoom] = useState('global');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [token, setToken] = useState(null);

  // Authenticate (username or JWT)
  const authenticate = (username, cb) => {
    socket.connect();
    socket.emit('authenticate', { username }, (res) => {
      if (res && res.token) setToken(res.token);
      cb && cb(res);
    });
  };

  // Join a room
  const joinRoom = (room) => {
    socket.emit('join_room', room);
    setCurrentRoom(room);
  };

  // Leave a room
  const leaveRoom = (room) => {
    socket.emit('leave_room', room);
    if (room === currentRoom) setCurrentRoom('global');
  };

  // Send a message
  const sendMessage = (message, room = currentRoom, cb) => {
    socket.emit('send_message', { message, room }, cb);
  };

  // Send a private message
  const sendPrivateMessage = (to, message, cb) => {
    socket.emit('private_message', { to, message }, cb);
  };

  // Set typing status
  const setTyping = (isTyping, room = currentRoom) => {
    socket.emit('typing', { room, isTyping });
  };

  // Send file (base64 or file object)
  const sendFile = (file, filename, type, room = currentRoom, cb) => {
    // For demo: expects base64 string
    socket.emit('send_file', { file, filename, type, room }, cb);
  };

  // Read receipt
  const readMessage = (messageId, room = currentRoom) => {
    socket.emit('read_message', { messageId, room });
  };

  // React to message
  const reactMessage = (messageId, reaction, room = currentRoom) => {
    socket.emit('react_message', { messageId, reaction, room });
  };

  // Delivery acknowledgment
  const ackMessage = (messageId, room = currentRoom) => {
    socket.emit('ack_message', { messageId, room });
  };

  // Pagination
  const getMessages = (page = 1, pageSize = 20, room = currentRoom, cb) => {
    socket.emit('get_messages', { room, page, pageSize }, cb);
  };

  // Search
  const searchMessages = (query, room = currentRoom, cb) => {
    socket.emit('search_messages', { room, query }, cb);
  };

  // Fetch rooms
  const fetchRooms = async () => {
    const res = await fetch('/api/rooms');
    const data = await res.json();
    setRooms(data);
  };

  // Socket event listeners
  useEffect(() => {
    // Connection events
    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    // Room events
    const onRoomJoined = (room) => {
      setCurrentRoom(room);
      fetchRooms();
    };

    // Message events
    const onReceiveMessage = (message) => {
      setLastMessage(message);
      setMessages((prev) => [...prev, message]);
      // Notification for new message
      setNotifications((prev) => [...prev, { type: 'message', message }]);
    };

    const onPrivateMessage = (message) => {
      setLastMessage(message);
      setMessages((prev) => [...prev, message]);
      setNotifications((prev) => [...prev, { type: 'private', message }]);
    };

    // User events
    const onUserList = (userList) => {
      setUsers(userList);
    };

    const onUserJoined = (user) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${user.username} joined the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
      setNotifications((prev) => [...prev, { type: 'user_joined', user }]);
    };

    const onUserLeft = (user) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${user.username} left the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
      setNotifications((prev) => [...prev, { type: 'user_left', user }]);
    };

    // Typing events
    const onTypingUsers = (users) => {
      setTypingUsers(users);
    };

    // Unread counts
    const onUnreadCounts = (counts) => {
      setUnreadCounts(counts);
    };

    // Read receipts
    const onMessageRead = ({ messageId, userId }) => {
      setMessages((prev) => prev.map(m => m.id === messageId ? { ...m, readBy: [...(m.readBy || []), userId] } : m));
    };

    // Reactions
    const onMessageReaction = ({ messageId, reaction, count }) => {
      setMessages((prev) => prev.map(m => m.id === messageId ? { ...m, reactions: { ...m.reactions, [reaction]: count } } : m));
    };

    // Delivery acknowledgments
    const onMessageAck = ({ messageId, userId }) => {
      setMessages((prev) => prev.map(m => m.id === messageId ? { ...m, delivered: true } : m));
    };

    // Register event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('receive_message', onReceiveMessage);
    socket.on('private_message', onPrivateMessage);
    socket.on('user_list', onUserList);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('typing_users', onTypingUsers);
    socket.on('room_joined', onRoomJoined);
    socket.on('unread_counts', onUnreadCounts);
    socket.on('message_read', onMessageRead);
    socket.on('message_reaction', onMessageReaction);
    socket.on('message_ack', onMessageAck);

    // Clean up event listeners
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('receive_message', onReceiveMessage);
      socket.off('private_message', onPrivateMessage);
      socket.off('user_list', onUserList);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('typing_users', onTypingUsers);
      socket.off('room_joined', onRoomJoined);
      socket.off('unread_counts', onUnreadCounts);
      socket.off('message_read', onMessageRead);
      socket.off('message_reaction', onMessageReaction);
      socket.off('message_ack', onMessageAck);
    };
  }, [currentRoom]);

  return {
    socket,
    isConnected,
    lastMessage,
    messages,
    users,
    typingUsers,
    rooms,
    currentRoom,
    unreadCounts,
    searchResults,
    notifications,
    token,
    authenticate,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendPrivateMessage,
    setTyping,
    sendFile,
    readMessage,
    reactMessage,
    ackMessage,
    getMessages,
    searchMessages,
    fetchRooms,
    setSearchResults,
    setMessages,
  };
};

export default socket;