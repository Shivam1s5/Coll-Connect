import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) return alert('Title and content are required');
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ title, content })
      });
      if (res.ok) {
        setTitle('');
        setContent('');
        fetchAnnouncements();
        alert('Announcement sent to all users!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send announcement');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const res = await fetch(`${backendUrl}/api/announcements/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) fetchAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="manage-users-container">
      <h2>Announcements Hub</h2>
      <p style={{color: '#9ca3af', marginBottom: '20px'}}>Broadcast system-wide messages to all registered users.</p>

      <form className="auth-form" onSubmit={handleSubmit} style={{maxWidth: '600px', marginBottom: '40px'}}>
        <div className="form-group">
          <label>Announcement Title</label>
          <input 
            type="text" 
            placeholder="e.g. Scheduled Maintenance" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="auth-input"
          />
        </div>
        <div className="form-group">
          <label>Detailed Message</label>
          <textarea 
            placeholder="Write your long announcement here..." 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="auth-input"
            style={{minHeight: '150px', resize: 'vertical'}}
          />
        </div>
        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'BROADCASTING...' : 'BROADCAST ANNOUNCEMENT'}
        </button>
      </form>

      <h3 className="section-heading blue-heading">Past Announcements</h3>
      <div className="user-list">
        {announcements.length === 0 ? <p style={{color: '#9ca3af'}}>No announcements yet.</p> : announcements.map(ann => (
          <div key={ann._id} className="user-card" style={{display: 'flex', flexDirection: 'column'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%'}}>
              <h4 style={{margin: '0 0 10px 0', color: '#60a5fa'}}>{ann.title}</h4>
              <button className="btn-action btn-red" onClick={() => handleDelete(ann._id)} style={{padding: '4px 8px'}}>Delete</button>
            </div>
            <p style={{margin: 0, color: '#e5e7eb', fontSize: '0.9rem', whiteSpace: 'pre-wrap', lineHeight: '1.4'}}>{ann.content}</p>
            <span style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '10px'}}>{new Date(ann.timestamp).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Announcements;
