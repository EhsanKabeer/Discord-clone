import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiSend } from 'react-icons/fi';
import { messageAPI } from '../services/api';
import MessageList from './MessageList';
import '../styles/MessageArea.css';

const MessageArea = ({ channel, server, socket }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    if (!channel) return;
    setLoading(true);
    try {
      const response = await messageAPI.getChannelMessages(channel._id);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [channel]);

  const joinChannel = useCallback(() => {
    if (channel && socket) {
      socket.emit('join-channel', channel._id);
    }
  }, [channel, socket]);

  useEffect(() => {
    if (channel) {
      fetchMessages();
      joinChannel();
    } else {
      setMessages([]);
    }

    return () => {
      if (channel && socket) {
        socket.emit('leave-channel', channel._id);
      }
    };
  }, [channel, socket, fetchMessages, joinChannel]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (message.channelId === channel?._id) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleTyping = (data) => {
      if (data.channelId === channel?._id) {
        setTypingUsers((prev) => {
          if (!prev.find((u) => u.userId === data.userId)) {
            return [...prev, { userId: data.userId, username: data.username }];
          }
          return prev;
        });

        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
        }, 3000);
      }
    };

    const handleStoppedTyping = (data) => {
      if (data.channelId === channel?._id) {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      }
    };

    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleTyping);
    socket.on('user-stopped-typing', handleStoppedTyping);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleTyping);
      socket.off('user-stopped-typing', handleStoppedTyping);
    };
  }, [socket, channel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // fetchMessages and joinChannel are memoized above for effect deps

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !channel || !socket) return;

    socket.emit('send-message', {
      content: newMessage.trim(),
      channelId: channel._id,
    });

    setNewMessage('');
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('typing-stop', { channelId: channel._id });
  };

  const handleTyping = () => {
    if (!channel || !socket) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socket.emit('typing-start', { channelId: channel._id });

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing-stop', { channelId: channel._id });
    }, 3000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!channel) {
    return (
      <div className="message-area empty">
        <div className="empty-state">
          <h3>Welcome</h3>
          <p>Select a channel on the left to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-area">
      <div className="message-header">
        <div className="channel-info">
          <span className="channel-name">#{channel.name}</span>
          {server && <span className="server-name">{server.name}</span>}
        </div>
      </div>

      <div className="messages-container">
        {loading ? (
          <div className="loading">Loading messages...</div>
        ) : (
          <>
            <MessageList messages={messages} />
            {typingUsers.length > 0 && (
              <div className="typing-indicator">
                {typingUsers.map((u) => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form className="message-input-container" onSubmit={handleSendMessage}>
        <div className="message-input-wrapper">
          <input
            type="text"
            className="message-input"
            placeholder={`Message #${channel.name}`}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!newMessage.trim()}
            aria-label="Send message"
          >
            <FiSend />
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageArea;

