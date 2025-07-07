import React from 'react';
import UserList from './UserList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

export default function Chat({ username, users, messages, sendMessage, typingUsers, setTyping }) {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside style={{ width: 200, background: '#f4f4f4', padding: 16 }}>
        <h3>Users</h3>
        <UserList users={users} />
      </aside>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: 16, borderBottom: '1px solid #ddd' }}>
          <h2>Welcome, {username}</h2>
        </header>
        <MessageList messages={messages} typingUsers={typingUsers} />
        <MessageInput sendMessage={sendMessage} setTyping={setTyping} />
      </main>
    </div>
  );
}
