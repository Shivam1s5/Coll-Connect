import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { X } from 'lucide-react';
import ContactSupportModal from './ContactSupportModal';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSupportOpen, setIsSupportOpen] = useState(false);

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
              <NavLink to="/profile" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
                My Profile
              </NavLink>
              <NavLink to="/messages" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
                Messages
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
                <NavLink to="/superadmin/users" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
                  Manage Users
                </NavLink>
                <NavLink to="/superadmin/tickets" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
                  Support Tickets
                </NavLink>
                <NavLink to="/superadmin/announcements" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
                  Announcements
                </NavLink>
                <NavLink to="/superadmin/reports" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
                  Reports
                </NavLink>
                <NavLink to="/superadmin/deletion-requests" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
                  Deletion Requests
                </NavLink>
              </nav>
            </div>
          )}

          {user?.role === 'admin' && (
            <div className="sidebar-section">
              <div className="section-title">ADMIN PANEL</div>
              <nav className="sidebar-nav">
                <NavLink to="/admin" end className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
                  Dashboard
                </NavLink>
                <NavLink to="/admin/users" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
                  Manage Users
                </NavLink>
                <NavLink to="/admin/reports" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
                  Reports
                </NavLink>
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
            <a href="#" className="support-link" onClick={(e) => { e.preventDefault(); setIsSupportOpen(true); }}>Contact Support</a>
          </div>
        </div>
      </div>
      
      <ContactSupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </>
  );
};

export default Sidebar;
