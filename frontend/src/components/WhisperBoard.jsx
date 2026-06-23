import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Search, Send, Lock, Trash2, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const WhisperBoard = () => {
  const { user, showToast } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  
  const [whispers, setWhispers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [showPostModal, setShowPostModal] = useState(false);
  const [targetUser, setTargetUser] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const fetchWhispers = async (query = '') => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/whispers?search=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWhispers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWhispers(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (socket) {
      const handleNewWhisper = () => {
        fetchWhispers(searchQuery);
      };
      socket.on('new-whisper', handleNewWhisper);
      return () => socket.off('new-whisper', handleNewWhisper);
    }
  }, [socket, searchQuery]);

  const handlePostWhisper = async (e) => {
    e.preventDefault();
    if (!targetUser.trim() || !content.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/whispers`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetUser, content, isAnonymous })
      });
      
      const data = await res.json();
      if (res.ok) {
        showToast('Whisper posted successfully!');
        setShowPostModal(false);
        setTargetUser('');
        setContent('');
        setIsAnonymous(false);
        // fetchWhispers(searchQuery); // handled by socket
      } else {
        showToast(data.error || 'Failed to post whisper');
      }
    } catch (err) {
      showToast('Error posting whisper');
    }
  };

  const handleDeleteWhisper = async (id) => {
    if (!window.confirm("Are you sure you want to forcibly delete this whisper?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/whispers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Whisper deleted successfully');
      } else {
        showToast('Failed to delete whisper');
      }
    } catch (err) {
      showToast('Error deleting whisper');
    }
  };

  return (
    <div className="whisper-board-container">
      {/* 3D Moonlit Stars Background */}
      <div className="stars-bg">
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
      </div>
      
      <div className="whisper-board-content custom-scrollbar">
        <div className="whisper-header">
          <h1 className="whisper-title">Whisper Board 🤫</h1>
          <p className="whisper-subtitle">Anonymously drop a compliment or confess your thoughts about someone.</p>
          
          <div className="whisper-controls">
            <div className="whisper-search-box">
              <Search size={18} color="#9ca3af" />
              <input 
                type="text" 
                placeholder="Search by username to see who whispered about them..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="post-whisper-btn" onClick={() => setShowPostModal(true)}>
              <Send size={16} /> Drop a Whisper
            </button>
          </div>
        </div>

        <div className="whisper-grid">
          {isLoading ? (
            <p style={{ textAlign: 'center', width: '100%', color: '#9ca3af' }}>Loading whispers...</p>
          ) : whispers.length === 0 ? (
            <div className="empty-whisper">
              <p>No whispers found. Be the first to drop one!</p>
            </div>
          ) : (
            whispers.map(w => (
              <div key={w._id} className="whisper-card">
                <div className="whisper-card-header">
                  <div className="author-info">
                    <span className="author-name">{w.authorDisplay}</span>
                    <span className="whisper-time">{new Date(w.timestamp).toLocaleDateString()}</span>
                  </div>
                  {user?.role === 'superadmin' && (
                    <button className="delete-whisper-btn" onClick={() => handleDeleteWhisper(w._id)} title="Forcibly delete this post">
                      <Trash2 size={16} color="#ef4444" />
                    </button>
                  )}
                </div>
                
                <div className="whisper-message">
                  "{w.content}"
                </div>

                {w.targetUserDetails && (
                  <div className="tagged-user-card" onClick={() => navigate('/messages', { state: { openChatWith: w.targetUserDetails.username } })}>
                    <div className="tagged-banner" style={w.targetUserDetails.bannerImage ? { backgroundImage: `url(${w.targetUserDetails.bannerImage})` } : {}}></div>
                    <div className="tagged-info">
                      <div className="tagged-avatar">
                        {w.targetUserDetails.profilePic ? (
                          <img src={w.targetUserDetails.profilePic} alt="Profile" />
                        ) : (
                          w.targetUserDetails.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="tagged-details">
                        <h4>{w.targetUserDetails.username}</h4>
                        <span className={`badge badge-${w.targetUserDetails.role || 'user'}`}>{(w.targetUserDetails.role || 'USER').toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Premium Unlock Button logic */}
                {w.isAnonymous && w.targetUser === user?.username && user?.role !== 'superadmin' && (
                  <button className="premium-reveal-btn" onClick={() => showToast('Premium feature coming soon!')}>
                    <Lock size={14} /> Reveal Sender (Premium)
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {showPostModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 style={{ marginBottom: '15px', color: '#fff' }}>Drop a Whisper</h3>
            <form onSubmit={handlePostWhisper} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: '#9ca3af', fontSize: '0.9rem' }}>Tag Username:</label>
                <input 
                  type="text" 
                  value={targetUser}
                  onChange={(e) => setTargetUser(e.target.value)}
                  placeholder="Enter exact username"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: '#9ca3af', fontSize: '0.9rem' }}>Message:</label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type your compliment or confession..."
                  required
                  rows="4"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff', resize: 'vertical' }}
                ></textarea>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  id="anon-check"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="anon-check" style={{ color: '#e2e8f0', cursor: 'pointer' }}>Post Anonymously</label>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowPostModal(false)} style={{ flex: 1, padding: '10px', background: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Drop It 🚀</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhisperBoard;
