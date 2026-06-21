import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Link } from 'react-router-dom';
import ImageModal from './ImageModal';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const Topbar = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
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

  useEffect(() => {
    if (socket) {
      socket.on('new-announcement', (ann) => {
        setAnnouncements(prev => [ann, ...prev]);
      });
      socket.on('delete-announcement', (id) => {
        setAnnouncements(prev => prev.filter(a => a._id !== id));
      });
    }
    return () => {
      if (socket) {
        socket.off('new-announcement');
        socket.off('delete-announcement');
      }
    }
  }, [socket]);

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
                    <div key={ann._id} className="notification-item" style={{borderLeft: '4px solid #ef4444', backgroundColor: 'rgba(31, 41, 55, 0.5)', padding: '12px', marginBottom: '10px', borderRadius: '8px'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px'}}>
                        <div style={{background: 'rgba(59, 130, 246, 0.2)', padding: '5px', borderRadius: '50%', color: '#60a5fa', display: 'flex'}}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path></svg>
                        </div>
                        <h5 className="notification-title">{ann.title}</h5>
                      </div>
                      {ann.imageUrl && (
                        <div className="announcement-image-wrapper" onClick={() => setSelectedImage(ann.imageUrl)} style={{cursor: 'pointer'}}>
                          <img src={ann.imageUrl} alt="Announcement" className="announcement-image" style={{maxHeight: '150px', objectFit: 'cover', width: '100%', borderRadius: '8px'}} />
                          <div style={{textAlign: 'center', fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px'}}>Tap to view full image</div>
                        </div>
                      )}
                      <p className="notification-content custom-scrollbar" style={{maxHeight: '100px', overflowY: 'auto', overflowX: 'hidden', paddingRight: '5px', display: 'block', wordBreak: 'break-all', overflowWrap: 'break-word', width: '100%', maxWidth: '100%', minWidth: 0}}>{ann.content}</p>
                      <span className="notification-time">{new Date(ann.timestamp).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <Link to="/profile" style={{textDecoration: 'none', color: 'inherit'}}>
          <div className="user-profile-badge" style={{cursor: 'pointer'}}>
            <div className="user-info-text">
              <span className="username">{user?.username || 'User'}</span>
              <span className={`badge badge-${user?.role || 'user'}`} style={{marginLeft: 0, marginTop: '2px', fontSize: '0.6rem'}}>{user?.role?.toUpperCase() || 'USER'}</span>
            </div>
            <div className="user-avatar" style={{overflow: 'hidden'}}>
              {user?.profilePic ? (
                <img src={user.profilePic} alt="Profile" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              ) : (
                user?.username ? user.username.charAt(0).toUpperCase() : 'U'
              )}
            </div>
          </div>
        </Link>
      </div>
      <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  );
};

export default Topbar;
