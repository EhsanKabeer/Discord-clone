import React from 'react';
import { FiHash, FiUsers, FiSearch } from 'react-icons/fi';
import '../styles/TopBar.css';

const TopBar = ({ title, subtitle, onToggleMembers, showMembers, onSearch }) => {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="topbar-title">
          <FiHash className="topbar-icon" />
          <span>{title || 'Select a channel'}</span>
        </div>
        {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
      </div>

      <div className="topbar-right">
        <div className="topbar-search">
          <FiSearch className="topbar-search-icon" />
          <input placeholder="Search" onChange={(e) => onSearch?.(e.target.value)} />
        </div>
        <button
          className={`topbar-btn ${showMembers ? 'active' : ''}`}
          onClick={onToggleMembers}
          title="Members"
          aria-label={showMembers ? 'Hide members' : 'Show members'}
        >
          <FiUsers />
        </button>
      </div>
    </div>
  );
};

export default TopBar;

