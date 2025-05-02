import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { FiHash, FiPlus, FiVolume2, FiLogOut } from 'react-icons/fi';
import { serverAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import '../styles/ChannelList.css';

const ChannelList = ({ server, onChannelSelect, selectedChannel, currentUser, onLogout, onOpenCreateServer }) => {
  const toast = useToast();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState('text');

  const fetchChannels = useCallback(async () => {
    if (!server) return;
    setLoading(true);
    try {
      const response = await serverAPI.getChannels(server._id);
      setChannels(response.data);
      if (response.data.length > 0 && !selectedChannel) {
        onChannelSelect(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  }, [server, selectedChannel, onChannelSelect]);

  useEffect(() => {
    if (server) {
      fetchChannels();
    } else {
      setChannels([]);
    }
  }, [server, fetchChannels]);

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!channelName.trim() || !server) return;

    try {
      const response = await serverAPI.createChannel(server._id, {
        name: channelName.trim(),
        type: channelType,
      });
      setChannels([...channels, response.data]);
      onChannelSelect(response.data);
      setChannelName('');
      setChannelType('text');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating channel:', error);
      toast.showError(error.response?.data?.message || 'Failed to create channel');
    }
  };

  const textChannels = useMemo(() => channels.filter((c) => (c.type || 'text') === 'text'), [channels]);
  const voiceChannels = useMemo(() => channels.filter((c) => c.type === 'voice'), [channels]);

  if (!server) {
    return (
      <div className="channel-panel empty">
        <div className="panel-empty">
          <div className="panel-empty-title">No server selected</div>
          <div className="panel-empty-subtitle">Pick a server from the left rail, or create a new one.</div>
          <button className="panel-primary" onClick={onOpenCreateServer}>
            Create server
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="channel-panel">
      <div className="panel-header">
        <div className="panel-server">
          <div className="panel-server-name">{server.name}</div>
          <button
            className="panel-icon"
            onClick={() => setShowCreateModal(true)}
            title="Create channel"
            aria-label="Create channel"
          >
            <FiPlus />
          </button>
        </div>
      </div>

      <div className="panel-scroll">
        <div className="panel-section">
          <div className="panel-section-label">
            <FiHash />
            <span>Text channels</span>
          </div>
          {loading ? (
            <div className="loading">Loading channels...</div>
          ) : textChannels.length === 0 ? (
            <div className="channels-empty">
              <p className="channels-empty-text">No text channels yet</p>
              <button
                type="button"
                className="panel-primary channels-empty-btn"
                onClick={() => setShowCreateModal(true)}
              >
                Create channel
              </button>
            </div>
          ) : (
            <div className="channels">
              {textChannels.map((channel) => (
                <button
                  key={channel._id}
                  className={`channel-item ${selectedChannel?._id === channel._id ? 'active' : ''}`}
                  onClick={() => onChannelSelect(channel)}
                >
                  <FiHash className="channel-icon" />
                  <span>{channel.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="panel-section">
          <div className="panel-section-label">
            <FiVolume2 />
            <span>Voice channels</span>
          </div>
          <div className="channels">
            {voiceChannels.length === 0 ? (
              <div className="panel-muted">No voice channels yet</div>
            ) : (
              voiceChannels.map((channel) => (
                <button
                  key={channel._id}
                  className={`channel-item ${selectedChannel?._id === channel._id ? 'active' : ''}`}
                  onClick={() => onChannelSelect(channel)}
                >
                  <FiVolume2 className="channel-icon" />
                  <span>{channel.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="panel-footer">
        <div className="panel-user">
          <img className="panel-avatar" src={currentUser?.avatar} alt={currentUser?.username} />
          <div className="panel-user-meta">
            <div className="panel-username">{currentUser?.username}</div>
            <div className="panel-status">Online</div>
          </div>
        </div>
        <button
          className="panel-icon"
          onClick={onLogout}
          title="Logout"
          aria-label="Logout"
        >
          <FiLogOut />
        </button>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Channel</h3>
            <form onSubmit={handleCreateChannel}>
              <div className="modal-row">
                <label className="modal-label">Channel type</label>
                <select
                  className="modal-select"
                  value={channelType}
                  onChange={(e) => setChannelType(e.target.value)}
                >
                  <option value="text">Text</option>
                  <option value="voice">Voice (UI)</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Channel name"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                autoFocus
                maxLength={50}
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelList;

