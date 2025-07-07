import React from 'react';

export default function UserList({ users }) {
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.username}</li>
      ))}
    </ul>
  );
}
