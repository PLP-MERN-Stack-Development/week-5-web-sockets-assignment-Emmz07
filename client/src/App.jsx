import React, { useState } from 'react';
import { useSocket } from './socket/socket';
import Chat from './components/Chat';

export default function App() {
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);
  const socketProps = useSocket();

  const handleJoin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      socketProps.connect(username);
      setJoined(true);
    }
  };

  if (!joined) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 100 }}>
        <h2>Join Chat</h2>
        <form onSubmit={handleJoin}>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <button type="submit">Join</button>
        </form>
      </div>
    );
  }

  return <Chat username={username} {...socketProps} />;
}
