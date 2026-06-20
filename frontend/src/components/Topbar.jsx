import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const Topbar = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchAnnouncements();
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/announcements`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setAnnouncements(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

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
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button className="icon-btn notification-btn" onClick={() => {
            setShowNotifications(!showNotifications);
            if (!showNotifications) fetchAnnouncements();
          }}>
            <Bell size={20} color="#e0e0e0" />
            {announcements.length > 0 && <span className="notification-dot"></span>}
          </button>
          
          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h4>System Announcements</h4>
              </div>
              <div className="notification-body">
                {announcements.length === 0 ? (
                  <p className="no-notifications">No announcements at the moment.</p>
                ) : (
                  announcements.map(ann => (
                    <div key={ann._id} className="notification-item">
                      <h5 className="notification-title">{ann.title}</h5>
                      {ann.imageUrl && (
                        <div style={{margin: '8px 0'}}>
                          <img src={ann.imageUrl} alt="Announcement" style={{width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #4b5563'}} />
                        </div>
                      )}
                      <p className="notification-content">{ann.content}</p>
                      <span className="notification-time">{new Date(ann.timestamp).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="user-profile-badge">
          <div className="user-info-text">
            <span className="username">{user?.username || 'User'}</span>
            <span className={`badge badge-${user?.role || 'user'}`} style={{marginLeft: 0, marginTop: '2px', fontSize: '0.6rem'}}>{user?.role?.toUpperCase() || 'USER'}</span>
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
