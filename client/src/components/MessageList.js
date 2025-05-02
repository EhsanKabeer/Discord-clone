import React from 'react';
import { formatMessageTime } from '../utils/formatTime';
import '../styles/MessageList.css';

const MessageList = ({ messages }) => {
  let lastDate = null;

  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <div className="empty-messages">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        messages.map((message) => {
          const showDate = lastDate !== new Date(message.createdAt).toDateString();
          lastDate = new Date(message.createdAt).toDateString();

          return (
            <div key={message._id}>
              {showDate && (
                <div className="date-divider">
                  <span>{new Date(message.createdAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}</span>
                </div>
              )}
              <div className="message with-avatar">
                <img
                  src={message.userId?.avatar}
                  alt={message.userId?.username ?? ''}
                  className="message-avatar"
                />
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-author">{message.userId?.username ?? 'Unknown'}</span>
                    <span className="message-time">{formatMessageTime(message.createdAt)}</span>
                    {message.edited && <span className="edited-badge">(edited)</span>}
                  </div>
                  <div className="message-text">{message.content}</div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default MessageList;

