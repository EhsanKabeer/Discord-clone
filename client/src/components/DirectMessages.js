import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiSend, FiSearch, FiUserPlus } from 'react-icons/fi';
import { dmAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import MessageList from './MessageList';
import '../styles/DirectMessages.css';

const idStr = (p) => (p == null ? '' : (p._id || p.id || p).toString?.() ?? String(p._id || p.id || p));

const DirectMessages = ({ selectedDM, onDMSelect, socket }) => {
  const { user } = useAuth();
  const toast = useToast();
  const currentUserIdStr = idStr(user);
  const [dms, setDMs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  const getOtherParticipant = useCallback((dm) => {
    if (!dm?.participants?.length) return null;
    const other = dm.participants.find((p) => idStr(p) !== currentUserIdStr);
    return other ?? dm.participants[0];
  }, [currentUserIdStr]);

  const fetchDMs = useCallback(async () => {
    try {
      const response = await dmAPI.getDMs();
      setDMs(response.data);
    } catch (error) {
      console.error('Error fetching DMs:', error);
    }
  }, []);

  useEffect(() => {
    fetchDMs();
  }, [fetchDMs]);

  const fetchMessages = useCallback(async () => {
    if (!selectedDM) return;
    setLoading(true);
    try {
      const response = await dmAPI.getDMMessages(selectedDM._id);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDM]);

  const joinDM = useCallback(() => {
    if (selectedDM && socket) {
      socket.emit('join-dm', selectedDM._id);
    }
  }, [selectedDM, socket]);

  useEffect(() => {
    if (selectedDM) {
      fetchMessages();
      joinDM();
    } else {
      setMessages([]);
    }

    return () => {
      if (selectedDM && socket) {
        socket.emit('leave-dm', selectedDM._id);
      }
    };
  }, [selectedDM, socket, fetchMessages, joinDM]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (message.dmId === selectedDM?._id) {
        setMessages((prev) => [...prev, message]);
      }
      // Update DM list to show latest message
      fetchDMs();
    };

    const handleTyping = (data) => {
      if (data.dmId === selectedDM?._id) {
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
      if (data.dmId === selectedDM?._id) {
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
  }, [socket, selectedDM, fetchDMs]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      try {
        const response = await userAPI.searchUsers(query);
        setSearchResults(response.data);
      } catch (error) {
        console.error('Error searching users:', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleCreateDM = async (userId) => {
    try {
      const response = await dmAPI.createDM({ userId });
      setDMs([response.data, ...dms.filter((dm) => dm._id !== response.data._id)]);
      onDMSelect(response.data);
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error creating DM:', error);
      toast.showError(error.response?.data?.message || 'Failed to create conversation');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedDM || !socket) return;

    socket.emit('send-message', {
      content: newMessage.trim(),
      dmId: selectedDM._id,
    });

    setNewMessage('');
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('typing-stop', { dmId: selectedDM._id });
  };

  const handleTyping = () => {
    if (!selectedDM || !socket) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socket.emit('typing-start', { dmId: selectedDM._id });

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing-stop', { dmId: selectedDM._id });
    }, 3000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  return (
    <div className="direct-messages">
      <div className="dm-sidebar">
        <div className="dm-header">
          <h2>Direct Messages</h2>
          <button
            type="button"
            className="dm-new-message-btn"
            onClick={() => setShowSearch(!showSearch)}
            title="New Message"
            aria-label="New message"
          >
            <FiUserPlus className="dm-new-message-icon" />
            <span className="dm-new-message-label">New</span>
          </button>
        </div>

        {showSearch && (
          <div className="search-container">
            <div className="search-input-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                className="search-input"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults
                  .filter((u) => idStr(u) !== currentUserIdStr)
                  .map((user) => (
                    <div
                      key={user._id}
                      className="search-result-item"
                      onClick={() => handleCreateDM(user._id)}
                    >
                      <img src={user.avatar} alt={user.username ?? ''} className="result-avatar" />
                      <div className="result-info">
                        <span className="result-username">{user.username}</span>
                        <span className={`result-status ${user.online ? 'online' : 'offline'}`}>
                          {user.online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        <div className="dm-list">
          {dms.length === 0 && !showSearch && (
            <div className="dm-list-empty">
              <p>No conversations yet</p>
              <p className="dm-list-empty-hint">Click the + button to message someone</p>
            </div>
          )}
          {dms.map((dm) => {
            const otherUser = getOtherParticipant(dm);
            const lastMessage = Array.isArray(dm.messages) ? dm.messages[0] : null;
            return (
              <div
                key={dm._id}
                className={`dm-item ${selectedDM?._id === dm._id ? 'active' : ''}`}
                onClick={() => onDMSelect(dm)}
              >
                <img src={otherUser?.avatar} alt={otherUser?.username ?? ''} className="dm-avatar" />
                <div className="dm-info">
                  <div className="dm-header-info">
                    <span className="dm-username">{otherUser?.username ?? 'Unknown'}</span>
                    {otherUser?.online && <span className="online-dot" aria-hidden="true" />}
                  </div>
                  {lastMessage?.content != null && (
                    <span className="dm-preview">
                      {lastMessage.userId?.username != null ? `${lastMessage.userId.username}: ` : ''}{lastMessage.content}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDM ? (
        <div className="dm-message-area">
          <div className="dm-message-header">
            {(() => {
              const otherUser = getOtherParticipant(selectedDM);
              return (
                <>
                  <img src={otherUser?.avatar} alt={otherUser?.username ?? ''} className="header-avatar" />
                  <div className="header-info">
                    <span className="header-username">{otherUser?.username ?? 'Unknown'}</span>
                    <span className={`header-status ${otherUser?.online ? 'online' : 'offline'}`}>
                      {otherUser?.online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="dm-messages-container">
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

          <form className="dm-message-input-container" onSubmit={handleSendMessage}>
            <div className="message-input-wrapper">
              <input
                type="text"
                className="message-input"
                placeholder="Type a message..."
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
      ) : (
        <div className="dm-empty-state">
          <div className="empty-state">
            <h3>Select a Conversation</h3>
            <p>Choose a conversation from the list or start a new one</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectMessages;

