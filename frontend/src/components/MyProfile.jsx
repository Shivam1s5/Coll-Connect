import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Camera, Edit2, Save, X, User as UserIcon, Link as LinkIcon, Instagram, Facebook, Linkedin, Github } from 'lucide-react';
import '../index.css';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const MyProfile = () => {
  const { user: authUser, login } = useAuth();
  const { socket } = useSocket();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Edit States
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  
  const [isEditingGender, setIsEditingGender] = useState(false);
  const [gender, setGender] = useState('');

  const [isEditingSocials, setIsEditingSocials] = useState(false);
  const [socials, setSocials] = useState({ instagram: '', facebook: '', linkedin: '', snapchat: '' });

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'friends'

  // Image Upload States
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        setNewUsername(data.username);
        setGender(data.gender || 'Not Specified');
        setSocials(data.socials || { instagram: '', facebook: '', linkedin: '', snapchat: '' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return alert('Image must be less than 5MB');
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;
    setIsUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', imageFile);

      const uploadRes = await fetch(`${backendUrl}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (!uploadRes.ok) throw new Error('Cloudinary upload failed');
      const uploadData = await uploadRes.json();
      
      const saveRes = await fetch(`${backendUrl}/api/profile-pic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ profilePic: uploadData.url })
      });

      if (saveRes.ok) {
        const data = await saveRes.json();
        setProfileData(prev => ({ ...prev, profilePic: data.profilePic }));
        setImageFile(null);
        setImagePreview('');
        // We do not have a setAuthUser context updater easily, but the topbar reads from context.
        // It might require a page reload to update the Topbar if we don't have a specific context update func.
        alert('Profile picture updated successfully! It may take a refresh to reflect everywhere.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveUsername = async () => {
    if (newUsername === profileData.username) {
      setIsEditingUsername(false);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/profile/change-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newUsername })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Username changed successfully! Please log in again.');
        login(data.token);
        window.location.reload();
      } else {
        alert(data.error || 'Failed to change username');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    }
  };

  const handleSaveGender = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/profile/gender`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ gender })
      });
      if (res.ok) {
        setProfileData(prev => ({ ...prev, gender }));
        setIsEditingGender(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSocials = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/profile/socials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ socials })
      });
      if (res.ok) {
        setProfileData(prev => ({ ...prev, socials }));
        setIsEditingSocials(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !profileData) {
    return <div className="loading-container">Loading Profile...</div>;
  }

  return (
    <div className="my-profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <div className="profile-tabs">
          <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Settings</button>
          <button className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>My Friends</button>
        </div>
      </div>

      {activeTab === 'profile' ? (
        <div className="profile-content grid-layout">
          {/* Avatar Section */}
          <div className="profile-card avatar-card">
            <div className="avatar-wrapper">
              <img src={imagePreview || profileData.profilePic || 'https://via.placeholder.com/150'} alt="Profile" className="profile-large-avatar" />
              <label htmlFor="profile-upload" className="avatar-edit-btn">
                <Camera size={18} />
              </label>
              <input type="file" id="profile-upload" accept="image/*" style={{display: 'none'}} onChange={handleImageChange} />
            </div>
            {imageFile && (
              <div className="upload-actions">
                <button className="btn-save" onClick={handleImageUpload} disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Save Picture'}
                </button>
                <button className="btn-cancel" onClick={() => {setImageFile(null); setImagePreview('');}} disabled={isUploading}>Cancel</button>
              </div>
            )}
            <h3 className="profile-role">{profileData.role.toUpperCase()}</h3>
          </div>

          {/* Details Section */}
          <div className="profile-details-grid">
            {/* Account Info */}
            <div className="profile-card info-card">
              <h3>Account Info</h3>
              <div className="info-row">
                <span className="info-label">Email</span>
                <span className="info-value text-muted">{profileData.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Username</span>
                {isEditingUsername ? (
                  <div className="edit-group">
                    <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="profile-input" />
                    <button className="btn-icon save" onClick={handleSaveUsername}><Save size={16}/></button>
                    <button className="btn-icon cancel" onClick={() => {setIsEditingUsername(false); setNewUsername(profileData.username);}}><X size={16}/></button>
                  </div>
                ) : (
                  <div className="value-group">
                    <span className="info-value">{profileData.username}</span>
                    <button className="btn-icon edit" onClick={() => setIsEditingUsername(true)} title="You can only change username once a year"><Edit2 size={14}/></button>
                  </div>
                )}
              </div>
              <div className="info-row">
                <span className="info-label">Gender</span>
                {isEditingGender ? (
                  <div className="edit-group">
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="profile-input">
                      <option value="Not Specified">Not Specified</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <button className="btn-icon save" onClick={handleSaveGender}><Save size={16}/></button>
                    <button className="btn-icon cancel" onClick={() => {setIsEditingGender(false); setGender(profileData.gender || 'Not Specified');}}><X size={16}/></button>
                  </div>
                ) : (
                  <div className="value-group">
                    <span className="info-value">{profileData.gender || 'Not Specified'}</span>
                    <button className="btn-icon edit" onClick={() => setIsEditingGender(true)}><Edit2 size={14}/></button>
                  </div>
                )}
              </div>
            </div>

            {/* Social Links */}
            <div className="profile-card info-card">
              <div className="card-header-flex">
                <h3>Social Links</h3>
                {!isEditingSocials && (
                  <button className="btn-action btn-blue" onClick={() => setIsEditingSocials(true)}>Edit Socials</button>
                )}
              </div>
              {isEditingSocials ? (
                <div className="socials-edit-form">
                  <div className="form-group"><label>Instagram</label><input type="text" className="profile-input" value={socials.instagram} onChange={e => setSocials({...socials, instagram: e.target.value})} placeholder="username" /></div>
                  <div className="form-group"><label>Facebook</label><input type="text" className="profile-input" value={socials.facebook} onChange={e => setSocials({...socials, facebook: e.target.value})} placeholder="profile link" /></div>
                  <div className="form-group"><label>LinkedIn</label><input type="text" className="profile-input" value={socials.linkedin} onChange={e => setSocials({...socials, linkedin: e.target.value})} placeholder="profile link" /></div>
                  <div className="form-group"><label>Snapchat</label><input type="text" className="profile-input" value={socials.snapchat} onChange={e => setSocials({...socials, snapchat: e.target.value})} placeholder="username" /></div>
                  <div className="edit-actions mt-2">
                    <button className="btn-save" onClick={handleSaveSocials}>Save Links</button>
                    <button className="btn-cancel" onClick={() => {setIsEditingSocials(false); setSocials(profileData.socials || { instagram: '', facebook: '', linkedin: '', snapchat: '' });}}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="socials-list">
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
        <div className="friends-section">
          <h3>Your Friends ({profileData.friends?.length || 0})</h3>
          <div className="friends-grid">
            {profileData.friends?.length > 0 ? (
              profileData.friends.map(f => (
                <div key={f.username} className="friend-card">
                  <img src={f.profilePic || 'https://via.placeholder.com/60'} alt={f.username} className="friend-avatar" />
                  <div className="friend-info">
                    <h4>{f.username}</h4>
                    <span className="friend-role">{f.role}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted">You have no friends yet. Start chatting to make friends!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
