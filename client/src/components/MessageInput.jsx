import React, { useState } from 'react';

export default function MessageInput({ sendMessage, setTyping }) {
  const [message, setMessage] = useState('');
  let typingTimeout;

  const handleChange = (e) => {
    setMessage(e.target.value);
    setTyping(true);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => setTyping(false), 1000);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
      setTyping(false);
    }
  };

  return (
    <form onSubmit={handleSend} style={{ display: 'flex', padding: 16, borderTop: '1px solid #ddd' }}>
      <input
        type="text"
        value={message}
        onChange={handleChange}
        placeholder="Type a message..."
        style={{ flex: 1, marginRight: 8 }}
      />
      <button type="submit">Send</button>
    </form>
  );
}
