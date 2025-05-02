import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ServerRail from '../components/ServerRail';
import ChannelList from '../components/ChannelList';
import MessageArea from '../components/MessageArea';
import DirectMessages from '../components/DirectMessages';
import TopBar from '../components/TopBar';
import MemberList from '../components/MemberList';
import { serverAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import '../styles/Home.css';

const Home = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const toast = useToast();
  const [selectedServer, setSelectedServer] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedDM, setSelectedDM] = useState(null);
  const [view, setView] = useState('servers'); // 'servers' | 'dms'
  const [showMembers, setShowMembers] = useState(true);
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [serverName, setServerName] = useState('');
  const [serverListKey, setServerListKey] = useState(0);

  useEffect(() => {
    if (socket) {
      socket.on('connect', () => {
        console.log('Socket connected');
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      return () => {
        socket.off('connect');
        socket.off('disconnect');
      };
    }
  }, [socket]);

  const handleServerSelect = (server) => {
    setSelectedServer(server);
    setSelectedChannel(null);
    setSelectedDM(null);
    setView('servers');
  };

  const handleChannelSelect = (channel) => {
    setSelectedChannel(channel);
    setSelectedDM(null);
  };

  const handleDMSelect = (dm) => {
    setSelectedDM(dm);
    setSelectedChannel(null);
    setSelectedServer(null);
    setView('dms');
  };

  const handleCreateServer = async (e) => {
    e.preventDefault();
    if (!serverName.trim()) return;
    try {
      const res = await serverAPI.createServer({ name: serverName.trim() });
      setSelectedServer(res.data);
      setSelectedChannel(null);
      setServerName('');
      setShowCreateServer(false);
      setServerListKey((k) => k + 1);
    } catch (err) {
      console.error('Error creating server:', err);
      toast.showError(err.response?.data?.message || 'Failed to create server');
    }
  };

  const topTitle = useMemo(() => {
    if (view === 'dms') return 'Direct Messages';
    if (!selectedChannel) return 'Select a channel';
    return selectedChannel.name;
  }, [view, selectedChannel]);

  const topSubtitle = useMemo(() => {
    if (view === 'dms') return 'Private conversations';
    if (!selectedChannel) return selectedServer ? `Welcome to ${selectedServer.name}` : 'Pick a server from the left rail';
    return selectedServer ? `Welcome to #${selectedChannel.name}` : '';
  }, [view, selectedChannel, selectedServer]);

  return (
    <div className="home-shell">
      <ServerRail
        key={serverListKey}
        selectedServerId={selectedServer?._id}
        activeView={view}
        onSelectDMs={() => setView('dms')}
        onSelectServer={handleServerSelect}
        onCreateServer={() => setShowCreateServer(true)}
      />

      <div className="home-main">
        <div className={`home-left ${view === 'dms' ? 'home-left-dms' : ''}`}>
          {view === 'servers' ? (
            <ChannelList
              server={selectedServer}
              onChannelSelect={handleChannelSelect}
              selectedChannel={selectedChannel}
              currentUser={user}
              onLogout={logout}
              onOpenCreateServer={() => setShowCreateServer(true)}
            />
          ) : (
            <DirectMessages selectedDM={selectedDM} onDMSelect={handleDMSelect} socket={socket} />
          )}
        </div>

        {view === 'servers' && (
          <>
            <div className="home-center">
              <TopBar
                title={topTitle}
                subtitle={topSubtitle}
                showMembers={showMembers}
                onToggleMembers={() => setShowMembers((v) => !v)}
              />
              <MessageArea channel={selectedChannel} server={selectedServer} socket={socket} />
            </div>
            {showMembers && <MemberList server={selectedServer} />}
          </>
        )}
      </div>

      {showCreateServer && (
        <div className="modal-overlay" onClick={() => setShowCreateServer(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Server</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: 13 }}>
              Give your workspace a name. A default #general channel will be created.
            </p>
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
                <button type="button" onClick={() => setShowCreateServer(false)} aria-label="Cancel">
                  Cancel
                </button>
                <button type="submit" aria-label="Create server">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

