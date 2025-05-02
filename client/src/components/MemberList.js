import React from 'react';
import '../styles/MemberList.css';

const MemberList = ({ server }) => {
  const members = server?.members || [];

  return (
    <div className="memberlist">
      <div className="memberlist-header">Members</div>
      <div className="memberlist-scroll">
        {members.length === 0 ? (
          <div className="memberlist-empty">No members to show</div>
        ) : (
          members.map((m) => (
            <div key={m._id} className="member-row">
              <img className="member-avatar" src={m.avatar} alt={m.username} />
              <div className="member-meta">
                <div className="member-name">{m.username}</div>
                <div className={`member-presence ${m.online ? 'online' : 'offline'}`}>
                  {m.online ? 'Online' : 'Offline'}
                </div>
              </div>
              <div className={`presence-dot ${m.online ? 'online' : 'offline'}`} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MemberList;

