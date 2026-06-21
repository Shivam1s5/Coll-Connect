import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Camera, Edit2, Save, X, User as UserIcon, Link as LinkIcon, Image as ImageIcon, Eye, Trash2, Upload } from 'lucide-react';
import { FaInstagram as Instagram, FaFacebook as Facebook, FaLinkedin as Linkedin, FaSnapchat as Snapchat } from 'react-icons/fa';
import ImageCropperModal from './ImageCropperModal';
import ImageModal from './ImageModal';
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

  // Image Cropper States
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState('');
  const [cropperFile, setCropperFile] = useState(null);
  const [cropperAspect, setCropperAspect] = useState(1); // 1 for profile, 16/9 for banner
  const [cropperTarget, setCropperTarget] = useState(''); // 'profile' or 'banner'
  const [isUploading, setIsUploading] = useState(false);

  // Popup & View States
  const [popupMenu, setPopupMenu] = useState(null); // 'profile' or 'banner'
  const [imageModalSrc, setImageModalSrc] = useState(null);

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

  const handleImageChange = (e, target) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return alert('Image must be less than 5MB');
      setCropperFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropperSrc(reader.result);
        setCropperTarget(target);
        setCropperAspect(target === 'profile' ? 1 : 16 / 9);
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (cropParams) => {
    setCropperOpen(false);
    if (!cropParams || !cropperFile) return;
    setIsUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', cropperFile);

      const uploadRes = await fetch(`${backendUrl}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (!uploadRes.ok) throw new Error('Cloudinary upload failed');
      const uploadData = await uploadRes.json();
      const originalUrl = uploadData.url;
      
      // Inject Cloudinary Transformation
      const parts = originalUrl.split('/upload/');
      let finalUrl = originalUrl;
      if (parts.length === 2) {
        const w = Math.round(cropParams.width);
        const h = Math.round(cropParams.height);
        const x = Math.round(cropParams.x);
        const y = Math.round(cropParams.y);
        finalUrl = `${parts[0]}/upload/c_crop,w_${w},h_${h},x_${x},y_${y}/${parts[1]}`;
      }
      
      const endpoint = cropperTarget === 'profile' ? '/api/profile-pic' : '/api/profile-banner';
      const payload = cropperTarget === 'profile' 
        ? { profilePic: finalUrl } 
        : { bannerImage: finalUrl };

      const saveRes = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (saveRes.ok) {
        const data = await saveRes.json();
        setProfileData(prev => ({ ...prev, ...data }));
        alert(`${cropperTarget === 'profile' ? 'Profile picture' : 'Background banner'} updated successfully!`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update image.');
    } finally {
      setIsUploading(false);
      setPopupMenu(null);
    }
  };

  const handleRemoveImage = async (target) => {
    if (!window.confirm(`Are you sure you want to remove your ${target === 'profile' ? 'profile picture' : 'background banner'}?`)) return;
    setIsUploading(true);
    setPopupMenu(null);
    try {
      const token = localStorage.getItem('token');
      const endpoint = target === 'profile' ? '/api/profile-pic' : '/api/profile-banner';
      const res = await fetch(`${backendUrl}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(prev => ({ ...prev, ...data }));
        alert(`${target === 'profile' ? 'Profile picture' : 'Background banner'} removed successfully.`);
      }
    } catch (err) {
      console.error('Failed to remove image', err);
      alert('Failed to remove image.');
    } finally {
      setIsUploading(false);
    }
  };

  const getOriginalImageUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return url;
    const afterUpload = url.substring(uploadIndex + 8);
    if (afterUpload.startsWith('v')) return url; // No transformations
    
    const nextSlash = afterUpload.indexOf('/');
    return url.substring(0, uploadIndex + 8) + afterUpload.substring(nextSlash + 1);
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
        <div className="profile-content grid-layout" onClick={() => setPopupMenu(null)}>
          {/* Avatar Section */}
          <div className="profile-card avatar-card" style={{padding: 0}}>
            {/* Banner Area */}
            <div className="banner-area" 
              onClick={(e) => { e.stopPropagation(); setPopupMenu('banner'); }}
              style={{ 
                height: '120px', 
                width: '100%', 
                backgroundColor: '#374151',
                backgroundImage: profileData.bannerImage ? `url(${profileData.bannerImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px',
                cursor: 'pointer'
              }}>
              <div className="banner-edit-btn" style={{position: 'absolute', top: '15px', right: '15px', backgroundColor: '#3b82f6', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.2)'}}>
                <Camera size={18} />
              </div>
              {popupMenu === 'banner' && (
                <div className="image-popup-menu" style={{position: 'absolute', top: '40px', right: '10px', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '5px', zIndex: 20, boxShadow: '0 4px 6px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', minWidth: '140px'}}>
                  {profileData.bannerImage && (
                    <button onClick={(e) => { e.stopPropagation(); setImageModalSrc(getOriginalImageUrl(profileData.bannerImage)); setPopupMenu(null); }} className="popup-menu-btn"><Eye size={16}/> View Banner</button>
                  )}
                  <label className="popup-menu-btn" onClick={(e) => e.stopPropagation()} style={{cursor: 'pointer', margin: 0}}>
                    <Upload size={16}/> Update Banner
                    <input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => { e.stopPropagation(); handleImageChange(e, 'banner'); }} />
                  </label>
                  {profileData.bannerImage && (
                    <button onClick={(e) => { e.stopPropagation(); handleRemoveImage('banner'); }} className="popup-menu-btn text-red"><Trash2 size={16}/> Remove Banner</button>
                  )}
                </div>
              )}
            </div>

            <div className="avatar-wrapper" style={{ marginTop: '-60px', position: 'relative' }} onClick={(e) => { e.stopPropagation(); setPopupMenu('profile'); }}>
              <img src={profileData.profilePic || 'https://via.placeholder.com/150'} alt="Profile" className="profile-large-avatar" style={{backgroundColor: '#1f2937', cursor: 'pointer'}} />
              <div className="avatar-edit-btn" style={{cursor: 'pointer', zIndex: 10}}>
                <Camera size={18} />
              </div>
              
              {popupMenu === 'profile' && (
                <div className="image-popup-menu" style={{position: 'absolute', top: '50px', left: '50%', transform: 'translateX(-50%)', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '5px', zIndex: 20, boxShadow: '0 4px 6px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', minWidth: '150px'}}>
                  {profileData.profilePic && (
                    <button onClick={(e) => { e.stopPropagation(); setImageModalSrc(getOriginalImageUrl(profileData.profilePic)); setPopupMenu(null); }} className="popup-menu-btn"><Eye size={16}/> View Picture</button>
                  )}
                  <label className="popup-menu-btn" onClick={(e) => e.stopPropagation()} style={{cursor: 'pointer', margin: 0}}>
                    <Upload size={16}/> Update Picture
                    <input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => { e.stopPropagation(); handleImageChange(e, 'profile'); }} />
                  </label>
                  {profileData.profilePic && (
                    <button onClick={(e) => { e.stopPropagation(); handleRemoveImage('profile'); }} className="popup-menu-btn text-red"><Trash2 size={16}/> Remove Picture</button>
                  )}
                </div>
              )}
            </div>
            
            <h3 className="profile-role" style={{marginBottom: '20px'}}>{profileData.role.toUpperCase()}</h3>
          </div>

          {/* Details Section */}
          <div className="profile-details-grid">
            {/* Account Info */}
            <div className="profile-card info-card">
              <h3>Account Info</h3>
              <div className="form-group" style={{marginTop: '15px'}}>
                <label>Email</label>
                <input type="text" className="profile-input text-muted" value={profileData.email} disabled />
              </div>
              
              <div className="form-group">
                <label>Username</label>
                {isEditingUsername ? (
                  <div className="edit-group">
                    <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="profile-input" />
                    <button className="btn-save" style={{padding: '10px'}} onClick={handleSaveUsername}>Save</button>
                    <button className="btn-cancel" style={{padding: '10px'}} onClick={() => {setIsEditingUsername(false); setNewUsername(profileData.username);}}>Cancel</button>
                  </div>
                ) : (
                  <div className="edit-group">
                    <input type="text" className="profile-input" value={profileData.username} disabled />
                    <button className="btn-action btn-blue" onClick={() => setIsEditingUsername(true)} title="Change Username">Edit</button>
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Gender</label>
                {isEditingGender ? (
                  <div className="edit-group">
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="profile-input">
                      <option value="Not Specified">Not Specified</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <button className="btn-save" style={{padding: '10px'}} onClick={handleSaveGender}>Save</button>
                    <button className="btn-cancel" style={{padding: '10px'}} onClick={() => {setIsEditingGender(false); setGender(profileData.gender || 'Not Specified');}}>Cancel</button>
                  </div>
                ) : (
                  <div className="edit-group">
                    <input type="text" className="profile-input" value={profileData.gender || 'Not Specified'} disabled />
                    <button className="btn-action btn-blue" onClick={() => setIsEditingGender(true)}>Edit</button>
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
      {isUploading && (
        <div className="modal-overlay" style={{zIndex: 99999}}>
          <div className="modal-content" style={{padding: '20px', textAlign: 'center'}}>
            <h3>Uploading Image...</h3>
            <p className="text-muted">Please wait while we process your request.</p>
          </div>
        </div>
      )}

      <ImageCropperModal 
        isOpen={cropperOpen}
        onClose={() => setCropperOpen(false)}
        imageSrc={cropperSrc}
        aspect={cropperAspect}
        onCropComplete={handleCropComplete}
      />

      <ImageModal 
        isOpen={!!imageModalSrc}
        onClose={() => setImageModalSrc(null)}
        imageUrl={imageModalSrc}
      />
    </div>
  );
};

export default MyProfile;
