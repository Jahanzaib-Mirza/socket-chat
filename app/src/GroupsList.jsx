import React from 'react';

const GroupsList = ({ groups }) => {
  return (
    <div>
      {groups.length === 0 ? (
        <p>No groups available.</p>
      ) : (
        groups.map((group) => (
          <div key={group._id} className="group">
            <h2 className="group-name">{group.name}</h2>
            <h2 className="group-name">{group._id}</h2>
            <p><strong>Participants:</strong> {group.participants.map(p => p.name).join(', ')}</p>
            <p><strong>Last Message:</strong> {group.lastMessage ? group.lastMessage.message : 'No messages'}</p>
            <p className="unread-count"><strong>Unread Messages:</strong> {group.unreadCount}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default GroupsList;
