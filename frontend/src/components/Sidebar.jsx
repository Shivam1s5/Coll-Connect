import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { X } from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={toggleSidebar}></div>}

      <div className={`sidebar-container ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="topbar-logo">
            <span className="logo-cc">CC</span>
            <span className="logo-text">Coll-Connect</span>
          </div>
          <button className="close-btn" onClick={toggleSidebar}>
            <X size={20} color="#e0e0e0" />
          </button>
        </div>

        <div className="sidebar-scroll-area">
          <div className="sidebar-section">
            <div className="section-title">HOME & CHAT</div>
            <nav className="sidebar-nav">
              <NavLink to="/" end className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
                Random Chat
              </NavLink>
              <NavLink to="/messages" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
                Messages & Friends
              </NavLink>
            </nav>
          </div>

          {user?.role === 'superadmin' && (
            <div className="sidebar-section">
              <div className="section-title">SUPERADMIN PANEL</div>
              <nav className="sidebar-nav">
                <NavLink to="/superadmin" end className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
                  Dashboard
                </NavLink>
                <div className="nav-item">Manage Users</div>
                <div className="nav-item">Support Tickets</div>
                <div className="nav-item">Announcements</div>
              </nav>
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
          
          <div className="footer-info">
            <div className="version-info">
              <strong>Coll-Connect</strong> <span className="version-badge">Version 1.0</span>
            </div>
            <p className="tagline">Empowering Seamless Connections. Bridging Distances with Secure, Real-time Communication.</p>
            <a href="#" className="support-link">Contact Support</a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
