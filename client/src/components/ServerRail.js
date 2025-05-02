import React, { useEffect, useState } from 'react';
import { FiPlus, FiMessageCircle } from 'react-icons/fi';
import { serverAPI } from '../services/api';
import '../styles/ServerRail.css';

const ServerRail = ({ selectedServerId, onSelectServer, onCreateServer, onSelectDMs, activeView }) => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const res = await serverAPI.getServers();
        setServers(res.data);
        if (!selectedServerId && res.data.length > 0 && activeView === 'servers') {
          onSelectServer(res.data[0]);
        }
      } catch (e) {
        console.error('Failed to load servers', e);
      } finally {
        setLoading(false);
      }
    };
    fetchServers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="server-rail">
      <button
        className={`rail-btn rail-home ${activeView === 'dms' ? 'active' : ''}`}
        onClick={onSelectDMs}
        title="Direct Messages"
        aria-label="Open Direct Messages"
      >
        <FiMessageCircle />
      </button>

      <div className="rail-divider" />

      <div className="rail-list">
        {loading ? (
          <div className="rail-skeleton">
            <div className="rail-dot" />
            <div className="rail-dot" />
            <div className="rail-dot" />
          </div>
        ) : (
          servers.length === 0 ? (
            <div className="rail-empty" aria-live="polite">
              <span className="rail-empty-text">No servers</span>
              <button
                type="button"
                className="rail-btn rail-add"
                onClick={onCreateServer}
                title="Create Server"
                aria-label="Create Server"
              >
                <FiPlus />
              </button>
            </div>
          ) : (
            servers.map((s) => (
              <button
                key={s._id}
                className={`rail-btn rail-server ${selectedServerId === s._id && activeView === 'servers' ? 'active' : ''}`}
                onClick={() => onSelectServer(s)}
                title={s.name}
                aria-label={`Server ${s.name}`}
              >
                <span className="rail-letter">{s.name?.charAt(0)?.toUpperCase()}</span>
              </button>
            ))
          )
        )}
      </div>

      <div className="rail-divider" />

      {servers.length > 0 && (
        <button
          type="button"
          className="rail-btn rail-add"
          onClick={onCreateServer}
          title="Create Server"
          aria-label="Create Server"
        >
          <FiPlus />
        </button>
      )}
    </div>
  );
};

export default ServerRail;

