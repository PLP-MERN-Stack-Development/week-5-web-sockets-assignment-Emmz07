import React, { useEffect, useRef } from 'react';

export default function MessageList({ messages, typingUsers }) {
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#fff' }}>
      {messages.map((msg) => (
        <div key={msg.id} style={{ marginBottom: 8 }}>
          {msg.system ? (
            <em style={{ color: '#888' }}>{msg.message}</em>
          ) : (
            <span>
              <strong>{msg.sender}:</strong> {msg.message}
              {msg.isPrivate && <span style={{ color: 'red', marginLeft: 8 }}>(private)</span>}
            </span>
          )}
        </div>
      ))}
      {typingUsers.length > 0 && (
        <div style={{ color: '#888', fontStyle: 'italic' }}>
          {typingUsers.join(', ')} typing...
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
