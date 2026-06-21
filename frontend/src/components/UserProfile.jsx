import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { User as UserIcon, Eye, Trash2, MessageCircle, Clock, UserPlus, Check, X, UserMinus, Lock } from 'lucide-react';
import { FaInstagram as Instagram, FaFacebook as Facebook, FaLinkedin as Linkedin, FaSnapchat as Snapchat } from 'react-icons/fa';
import ImageModal from './ImageModal';
import '../index.css';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const UserProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { showToast, showConfirm } = useToast();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [imageModalSrc, setImageModalSrc] = useState(null);
  const [popupMenu, setPopupMenu] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchProfile();
    setActiveTab('profile');
    setPopupMenu(null);
  }, [username]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/users/${username}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
      } else {
        setProfileData(null);
      }
    } catch (err) {
      console.error(err);
      setProfileData(null);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/friend-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ targetUsername: username })
      });
      if (res.ok) {
        showToast(`Friend request sent to ${username}`);
        fetchProfile();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to send request');
      }
    } catch (err) {
      showToast('Server error');
    }
  };

  const respondToRequest = async (action) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = action === 'accept' ? '/api/friend-accept' : '/api/friend-decline';
      const res = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ targetUsername: username })
      });
      if (res.ok) {
        showToast(`Request ${action}ed`);
        fetchProfile();
      } else {
        showToast(`Failed to ${action} request`);
      }
    } catch (err) {
      showToast('Server error');
    }
  };

  const unfriend = async () => {
    showConfirm(`Are you sure you want to unfriend ${username}? This will also delete your chat history.`, async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${backendUrl}/api/unfriend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ targetUsername: username })
        });
        if (res.ok) {
          showToast(`Unfriended ${username}`);
          fetchProfile();
        } else {
          showToast(`Failed to unfriend`);
        }
      } catch (err) {
        showToast('Server error');
      }
    });
  };

  const getOriginalImageUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return url;
    const afterUpload = url.substring(uploadIndex + 8);
    if (afterUpload.startsWith('v')) return url; 
    
    const nextSlash = afterUpload.indexOf('/');
    return url.substring(0, uploadIndex + 8) + afterUpload.substring(nextSlash + 1);
  };

  const handleForceRemoveImage = async (target) => {
    setIsProcessing(true);
    setPopupMenu(null);
    try {
      const token = localStorage.getItem('token');
      const endpoint = target === 'profile' ? `/api/admin/users/${username}/profile-pic` : `/api/admin/users/${username}/banner`;
      const res = await fetch(`${backendUrl}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showToast(`${target === 'profile' ? 'Profile picture' : 'Background banner'} forcefully removed.`);
        fetchProfile();
      } else {
        showToast('Failed to remove image.');
      }
    } catch (err) {
      console.error('Failed to remove image', err);
      showToast('Failed to remove image.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading Profile...</div>;
  }

  if (!profileData) {
    return <div className="loading-container">User not found.</div>;
  }

  const isSuperadmin = authUser?.role === 'superadmin';

  const getBadgeStyle = (role) => {
    switch(role) {
      case 'superadmin': 
        return { 
          background: 'linear-gradient(135deg, #FFD700 0%, #FFF8DC 50%, #FFD700 100%)', 
          color: '#8B6508', 
          padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', 
          boxShadow: '0 2px 5px rgba(255, 215, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.8)',
          border: '1px solid #DAA520', textShadow: '0 1px 1px rgba(255,255,255,0.8)'
        };
      case 'admin': 
        return { 
          background: 'linear-gradient(135deg, #C0C0C0 0%, #F5F5F5 50%, #C0C0C0 100%)', 
          color: '#4F4F4F', 
          padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', 
          boxShadow: '0 2px 5px rgba(192, 192, 192, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.8)',
          border: '1px solid #A9A9A9', textShadow: '0 1px 1px rgba(255,255,255,0.8)'
        };
      default: 
        return { 
          background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 50%, #8B5CF6 100%)', 
          color: '#fff', 
          padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', 
          boxShadow: '0 2px 5px rgba(139, 92, 246, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
          border: '1px solid #7C3AED', textShadow: '0 1px 1px rgba(0,0,0,0.3)'
        };
    }
  };

  const isLocked = profileData.isPrivate && profileData.socials === null;

  return (
    <div className="my-profile-container">
      <div className="profile-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ margin: 0 }}>{profileData.username}'s Profile</h1>
          <span style={getBadgeStyle(profileData.role)}>{profileData.role === 'superadmin' ? 'Superadmin' : profileData.role === 'admin' ? 'Admin' : 'User'}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {profileData.username !== authUser?.username && (
            profileData.isFriend ? (
              <>
                <button className="btn-action" style={{display: 'flex', alignItems: 'center', gap: '8px', background: '#374151', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer'}} onClick={unfriend}>
                  <UserMinus size={18} /> Unfriend
                </button>
                <button className="btn-action" style={{display: 'flex', alignItems: 'center', gap: '8px', background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer'}} onClick={() => navigate('/messages')}>
                  <MessageCircle size={18} /> Message
                </button>
              </>
            ) : profileData.hasSentRequest ? (
              <button disabled className="btn-action" style={{display: 'flex', alignItems: 'center', gap: '8px', background: '#374151', color: '#9ca3af', border: 'none', padding: '8px 16px', borderRadius: '8px'}}>
                <Clock size={18} /> Request Pending
              </button>
            ) : profileData.hasReceivedRequest ? (
              <>
                <button className="btn-action" style={{display: 'flex', alignItems: 'center', gap: '8px', background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer'}} onClick={() => respondToRequest('accept')}>
                  <Check size={18} /> Accept Request
                </button>
                <button className="btn-action" style={{display: 'flex', alignItems: 'center', gap: '8px', background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer'}} onClick={() => respondToRequest('decline')}>
                  <X size={18} /> Decline
                </button>
              </>
            ) : (
              <button className="btn-action" style={{display: 'flex', alignItems: 'center', gap: '8px', background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer'}} onClick={sendFriendRequest}>
                <UserPlus size={18} /> Add Friend
              </button>
            )
          )}
        </div>
      </div>
      <div className="profile-tabs">
        <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile</button>
        {!isLocked && (
          <button className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>Friends ({profileData.friends?.length || 0})</button>
        )}
      </div>

      {activeTab === 'profile' ? (
        <div className="profile-content grid-layout" onClick={() => setPopupMenu(null)}>
          <div className="profile-card avatar-card" style={{padding: 0}}>
            <div className="banner-area" 
              onClick={(e) => { e.stopPropagation(); setPopupMenu('banner'); }}
              style={{ 
                height: '120px', 
                width: '100%', 
                backgroundColor: '#374151',
                backgroundImage: profileData.bannerImage ? `url(${profileData.bannerImage})` : 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px',
                cursor: 'pointer'
              }}>
              {popupMenu === 'banner' && (
                <div className="image-popup-menu" style={{position: 'absolute', top: '40px', right: '10px', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '5px', zIndex: 20, boxShadow: '0 4px 6px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', minWidth: '140px'}}>
                  {profileData.bannerImage && (
                    <button onClick={(e) => { e.stopPropagation(); setImageModalSrc(getOriginalImageUrl(profileData.bannerImage)); setPopupMenu(null); }} className="popup-menu-btn"><Eye size={16}/> View Banner</button>
                  )}
                  {isSuperadmin && profileData.bannerImage && (
                    <button onClick={(e) => { 
                      e.stopPropagation(); 
                      showConfirm(`SUPERADMIN ACTION: Are you sure you want to FORCE REMOVE this user's banner? This cannot be undone.`, () => handleForceRemoveImage('banner'));
                    }} className="popup-menu-btn text-red"><Trash2 size={16}/> Remove Banner</button>
                  )}
                  {(!profileData.bannerImage && !isSuperadmin) && <span style={{padding: '5px', color: '#9ca3af', fontSize: '12px'}}>No banner</span>}
                </div>
              )}
            </div>

            <div className="avatar-wrapper" style={{ marginTop: '-60px', position: 'relative' }} onClick={(e) => { e.stopPropagation(); setPopupMenu('profile'); }}>
              {profileData.profilePic ? (
                <img src={profileData.profilePic} alt="Profile" className="profile-large-avatar" style={{backgroundColor: '#1f2937', cursor: 'pointer'}} />
              ) : (
                <div className="profile-large-avatar" style={{backgroundColor: '#1f2937', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <UserIcon size={80} color="#9ca3af" />
                </div>
              )}
              
              {popupMenu === 'profile' && (
                <div className="image-popup-menu" style={{position: 'absolute', top: '50px', left: '50%', transform: 'translateX(-50%)', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '5px', zIndex: 20, boxShadow: '0 4px 6px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', minWidth: '150px'}}>
                  {profileData.profilePic && (
                    <button onClick={(e) => { e.stopPropagation(); setImageModalSrc(getOriginalImageUrl(profileData.profilePic)); setPopupMenu(null); }} className="popup-menu-btn"><Eye size={16}/> View Picture</button>
                  )}
                  {isSuperadmin && profileData.profilePic && (
                    <button onClick={(e) => { 
                      e.stopPropagation(); 
                      showConfirm(`SUPERADMIN ACTION: Are you sure you want to FORCE REMOVE this user's profile picture? This cannot be undone.`, () => handleForceRemoveImage('profile'));
                    }} className="popup-menu-btn text-red"><Trash2 size={16}/> Remove Picture</button>
                  )}
                  {(!profileData.profilePic && !isSuperadmin) && <span style={{padding: '5px', color: '#9ca3af', fontSize: '12px'}}>No picture</span>}
                </div>
              )}
            </div>
            
          </div>

          <div className="profile-details-grid">
            <div className="profile-card info-card">
              <h3>Account Info</h3>
              <div className="form-group" style={{marginTop: '15px'}}>
                <label>Username</label>
                <input type="text" className="profile-input" value={profileData.username} disabled />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <input type="text" className="profile-input" value={profileData.gender || 'Not Specified'} disabled />
              </div>
            </div>

            <div className="profile-card info-card">
              <h3>Social Links</h3>
              {isLocked ? (
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 10px', color: '#9ca3af', textAlign: 'center'}}>
                  <div style={{width: '60px', height: '60px', borderRadius: '50%', border: '2px solid #374151', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px'}}>
                    <Lock size={30} color="#6b7280" />
                  </div>
                  <h4 style={{margin: '0 0 5px 0', color: '#e5e7eb'}}>This account is private</h4>
                  <p style={{fontSize: '0.85rem', margin: 0}}>Become friends to see their social links and friends list.</p>
                </div>
              ) : (
                <div className="socials-list" style={{marginTop: '15px'}}>
                  <div className="social-item">
                    <Instagram size={18} className="social-icon text-pink"/> 
                    <span className="social-text">{profileData.socials?.instagram || 'Not set'}</span>
                  </div>
                  <div className="social-item">
                    <Facebook size={18} className="social-icon text-blue"/> 
                    <span className="social-text">{profileData.socials?.facebook || 'Not set'}</span>
                  </div>
                  <div className="social-item">
                    <Linkedin size={18} className="social-icon text-lightblue"/> 
                    <span className="social-text">{profileData.socials?.linkedin || 'Not set'}</span>
                  </div>
                  <div className="social-item">
                    <span style={{fontWeight: 'bold', marginRight: '8px', color: '#eab308'}}>👻</span> 
                    <span className="social-text">{profileData.socials?.snapchat || 'Not set'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="friends-section" style={{marginTop: '20px'}}>
          <h3>{profileData.username}'s Friends ({profileData.friends?.length || 0})</h3>
          <div className="friends-grid">
            {profileData.friends?.length > 0 ? (
              profileData.friends.map(f => (
                <div key={f.username} className="friend-card" style={{cursor: 'pointer'}} onClick={() => navigate(`/user/${f.username}`)}>
                  {f.profilePic ? (
                    <img src={f.profilePic} alt={f.username} className="friend-avatar" />
                  ) : (
                    <div className="friend-avatar" style={{backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <UserIcon size={24} color="#9ca3af" />
                    </div>
                  )}
                  <div className="friend-info">
                    <h4>{f.username}</h4>
                    <span className="friend-role">{f.role}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted">This user has no friends yet.</p>
            )}
          </div>
        </div>
      )}
      
      {isProcessing && (
        <div className="modal-overlay" style={{zIndex: 99999}}>
          <div className="modal-content" style={{padding: '20px', textAlign: 'center'}}>
            <h3>Processing...</h3>
            <p className="text-muted">Please wait.</p>
          </div>
        </div>
      )}

      <ImageModal 
        isOpen={!!imageModalSrc}
        onClose={() => setImageModalSrc(null)}
        imageUrl={imageModalSrc}
      />
    </div>
  );
};

export default UserProfile;
