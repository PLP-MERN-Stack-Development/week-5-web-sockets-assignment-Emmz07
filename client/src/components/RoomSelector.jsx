import React, { useEffect, useState } from 'react';

export default function RoomSelector({ rooms, currentRoom, joinRoom, fetchRooms }) {
  const [newRoom, setNewRoom] = useState('');

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line
  }, []);

  const handleJoin = (room) => {
    if (room && room !== currentRoom) joinRoom(room);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (newRoom.trim() && !rooms.includes(newRoom.trim())) {
      joinRoom(newRoom.trim());
      setNewRoom('');
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <h4>Rooms</h4>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {rooms.map(room => (
          <li key={room}>
            <button
              style={{ fontWeight: room === currentRoom ? 'bold' : 'normal', marginBottom: 4 }}
              onClick={() => handleJoin(room)}
              disabled={room === currentRoom}
            >
              {room}
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleCreate} style={{ marginTop: 8 }}>
        <input
          type="text"
          placeholder="New room name"
          value={newRoom}
          onChange={e => setNewRoom(e.target.value)}
        />
        <button type="submit">Create/Join</button>
      </form>
    </div>
  );
}
