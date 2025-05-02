import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiUsers, FiPlus, FiLogOut, FiSettings } from 'react-icons/fi';
import { serverAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import '../styles/Sidebar.css';

const Sidebar = ({ user, onLogout, view, setView, onServerSelect, onDMSelect }) => {
  const toast = useToast();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [serverName, setServerName] = useState('');

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const response = await serverAPI.getServers();
      setServers(response.data);
      if (response.data.length > 0 && !view) {
        onServerSelect(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateServer = async (e) => {
    e.preventDefault();
    if (!serverName.trim()) return;

    try {
      const response = await serverAPI.createServer({ name: serverName.trim() });
      setServers([...servers, response.data]);
      onServerSelect(response.data);
      setServerName('');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating server:', error);
      toast.showError(error.response?.data?.message || 'Failed to create server');
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="user-info">
          <img src={user?.avatar} alt={user?.username} className="user-avatar" />
          <div className="user-details">
            <span className="username">{user?.username}</span>
            <span className="user-status online">Online</span>
          </div>
        </div>
        <button className="icon-button" onClick={onLogout} title="Logout" aria-label="Logout">
          <FiLogOut />
        </button>
      </div>

      <div className="sidebar-tabs">
        <button
          className={`tab-button ${view === 'servers' ? 'active' : ''}`}
          onClick={() => setView('servers')}
        >
          <FiMessageSquare />
          <span>Servers</span>
        </button>
        <button
          className={`tab-button ${view === 'dms' ? 'active' : ''}`}
          onClick={() => setView('dms')}
        >
          <FiUsers />
          <span>Messages</span>
        </button>
      </div>

      {view === 'servers' && (
        <div className="sidebar-content">
          <div className="section-header">
            <h3>Your Servers</h3>
            <button
              className="icon-button small"
              onClick={() => setShowCreateModal(true)}
              title="Create Server"
            >
              <FiPlus />
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading servers...</div>
          ) : (
            <div className="server-list">
              {servers.map((server) => (
                <div
                  key={server._id}
                  className="server-item"
                  onClick={() => onServerSelect(server)}
                  title={server.name}
                >
                  <div className="server-icon">
                    {server.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Server</h3>
            <form onSubmit={handleCreateServer}>
              <input
                type="text"
                placeholder="Server name"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
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

export default Sidebar;

