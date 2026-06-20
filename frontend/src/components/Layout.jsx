import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const NavButton = ({ path, icon, label, danger }) => {
    const isActive = location.pathname === path;
    return (
      <button 
        className={`sidebar-btn ${isActive ? 'active' : ''} ${danger ? 'danger' : ''}`}
        onClick={() => {
          navigate(path);
          setSidebarOpen(false);
        }}
      >
        <span style={{ marginRight: '1rem', fontSize: '1.2rem' }}>{icon}</span>
        {label}
      </button>
    );
  };

  return (
    <div className="app-container">
      {/* Mobile Menu Toggle (only show if logged in and not on landing page) */}
      <div className="app-navbar" style={{ padding: '1rem 2rem' }}>
        <div className="navbar-brand">
          <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user && (
              <span 
                style={{ fontSize: '1.5rem', cursor: 'pointer', display: 'inline-block', color: 'white' }} 
                onClick={(e) => { e.stopPropagation(); setSidebarOpen(true); }}
              >
                ☰
              </span>
            )}
            Coll-Connect
          </h1>
        </div>
        <div className="navbar-profile">
          {user ? (
            <div className="profile-info" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div className="profile-name">{user.name}</div>
                <div className="profile-role">{user.role}</div>
              </div>
              <div className="profile-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          ) : (
            <button className="btn" onClick={() => navigate('/auth')}>Login / Register</button>
          )}
        </div>
      </div>

      {/* Sidebar */}
      {user && (
        <>
          <div className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-logo" onClick={() => navigate('/')}>
              {/* Logo text handled by CSS ::after */}
            </div>
            
            <div className="nav-menu">
              <div className="sidebar-section">
                <div className="sidebar-heading">Main</div>
                <NavButton path="/app" icon="🎥" label="Video Chat" />
              </div>

              {(user.role === 'admin' || user.role === 'superadmin') && (
                <div className="sidebar-section">
                  <div className="sidebar-heading">Management</div>
                  <NavButton path="/app/admin" icon="🛡️" label="Admin Portal" />
                </div>
              )}

              {user.role === 'superadmin' && (
                <div className="sidebar-section">
                  <div className="sidebar-heading">System</div>
                  <NavButton path="/app/superadmin" icon="⚙️" label="SuperAdmin Dashboard" />
                </div>
              )}
              
              <div className="sidebar-bottom">
                 <button className="sidebar-btn danger" onClick={handleLogout}>
                   <span style={{ marginRight: '1rem', fontSize: '1.2rem' }}>🚪</span>
                   Logout
                 </button>
              </div>
            </div>
          </div>
          {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
        </>
      )}

      {/* Main Content Area */}
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
