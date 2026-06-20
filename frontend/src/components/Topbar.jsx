import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Topbar = ({ toggleSidebar }) => {
  const { user } = useAuth();

  return (
    <div className="topbar-container">
      <div className="topbar-left">
        <button className="icon-btn" onClick={toggleSidebar}>
          <Menu size={24} color="#e0e0e0" />
        </button>
        <div className="topbar-logo">
          <span className="logo-cc">CC</span>
          <span className="logo-text">Coll-Connect</span>
        </div>
      </div>
      
      <div className="topbar-right">
        <button className="icon-btn notification-btn">
          <Bell size={20} color="#e0e0e0" />
          <span className="notification-dot"></span>
        </button>
        <div className="user-profile-badge">
          <div className="user-info-text">
            <span className="username">{user?.username || 'User'}</span>
            <span className="role">{user?.role?.toUpperCase() || 'USER'}</span>
          </div>
          <div className="user-avatar">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
