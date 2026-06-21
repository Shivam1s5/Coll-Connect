import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const ManageUsers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [blockDurations, setBlockDurations] = useState({});

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/admin/users?t=${new Date().getTime()}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (socket) {
      socket.on('admin-update', fetchUsers);
    }
    return () => {
      if (socket) socket.off('admin-update', fetchUsers);
    };
  }, [socket, fetchUsers]);

  const handleAction = async (endpoint, payload) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/admin/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const promoteUser = (username) => handleAction('promote', { username });
  const dismissAdmin = (username) => handleAction('dismiss', { username });
  const deleteUser = (username) => {
    if (window.confirm(`Are you sure you want to permanently delete ${username}?`)) {
      handleAction('force-delete-user', { username });
    }
  };
  
  const blockUser = (username) => {
    const duration = blockDurations[username] || '30 Mins';
    let apiDuration = 'none';
    if (duration === '30 Mins') apiDuration = '30';
    else if (duration === '1 Hour') apiDuration = '60';
    else if (duration === 'Permanent') apiDuration = 'permanent';
    
    if (window.confirm(`Block ${username} for ${duration}?`)) {
      handleAction('direct-warn-user', { username, duration: apiDuration, reason: 'Superadmin Block' });
    }
  };

  const unblockUser = (username) => {
    if (window.confirm(`Are you sure you want to unblock ${username}?`)) {
      handleAction('unblock-user', { username });
    }
  };

  const isBlocked = (blockedUntil) => {
    if (!blockedUntil) return false;
    if (blockedUntil === 'permanent') return true;
    return new Date(blockedUntil) > new Date();
  };

  const handleDurationChange = (username, value) => {
    setBlockDurations(prev => ({ ...prev, [username]: value }));
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const admins = filteredUsers.filter(u => u.role === 'admin' || u.role === 'superadmin');
  const normalUsers = filteredUsers.filter(u => u.role === 'user');

  return (
    <div className="manage-users-container">
      <h2>All Registered Users</h2>
      
      <div className="search-bar-wrapper">
        <input 
          type="text" 
          placeholder="Search by username or email..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search-input"
        />
      </div>

      {loading ? <p style={{color: '#9ca3af'}}>Loading users...</p> : (
        <>
          <div className="user-section">
            <h3 className="section-heading blue-heading">Admins ({admins.length})</h3>
            <div className="user-list">
              {admins.map(u => (
                <div key={u.username} className="user-card admin-card">
                  <div className="user-card-row">
                    <span className="label">Username:</span>
                    <span className="value">{u.username}</span>
                    <span className={`badge ${u.role === 'superadmin' ? 'badge-superadmin' : 'badge-admin'}`}>
                      {u.role.toUpperCase()}
                    </span>
                  </div>
                  <div className="user-card-row">
                    <span className="label">Email:</span>
                    <span className="value">{u.email}</span>
                  </div>
                  <div className="user-card-row">
                    <span className="label text-danger">Password:</span>
                    <span className="value text-danger">{u.password || '*********'}</span>
                  </div>
                  
                  <div className="user-actions row-actions" style={{marginTop: '10px'}}>
                    {u.role !== 'superadmin' && (
                      <button className="btn-action" style={{backgroundColor: '#3b82f6', color: 'white'}} onClick={() => navigate(`/user/${u.username}`)}>VISIT PROFILE</button>
                    )}
                    {u.role === 'admin' && (
                      <button className="btn-action btn-red" onClick={() => dismissAdmin(u.username)}>
                        DISMISS ADMIN
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="user-section">
            <h3 className="section-heading green-heading">Normal Users ({normalUsers.length})</h3>
            <div className="user-list">
              {normalUsers.map(u => (
                <div key={u.username} className="user-card">
                  <div className="user-card-row">
                    <span className="label">Username:</span>
                    <span className="value">{u.username}</span>
                    <span className="badge badge-user">USER</span>
                  </div>
                  <div className="user-card-row">
                    <span className="label">Email:</span>
                    <span className="value">{u.email}</span>
                  </div>
                  <div className="user-card-row">
                    <span className="label text-danger">Password:</span>
                    <span className="value text-danger">{u.password || '*********'}</span>
                  </div>
                  
                  <div className="user-actions row-actions mt-2">
                    <button className="btn-action" style={{backgroundColor: '#3b82f6', color: 'white'}} onClick={() => navigate(`/user/${u.username}`)}>VISIT PROFILE</button>
                    <button className="btn-action btn-red" onClick={() => deleteUser(u.username)}>DELETE ID</button>
                    <button className="btn-action btn-blue" onClick={() => promoteUser(u.username)}>PROMOTE TO ADMIN</button>
                  </div>
                  
                  {isBlocked(u.blockedUntil) ? (
                    <div className="user-actions row-actions mt-2" style={{alignItems: 'center'}}>
                      <button className="btn-action btn-blue" onClick={() => unblockUser(u.username)}>UNBLOCK USER</button>
                      <span style={{color: '#ef4444', fontSize: '0.8rem', marginLeft: '10px'}}>
                        {u.blockedUntil === 'permanent' ? 'Permanently Blocked' : `Blocked until ${new Date(u.blockedUntil).toLocaleString()}`}
                      </span>
                    </div>
                  ) : (
                    <div className="user-actions row-actions mt-2">
                      <select 
                        className="admin-select"
                        value={blockDurations[u.username] || '30 Mins'}
                        onChange={(e) => handleDurationChange(u.username, e.target.value)}
                      >
                        <option>30 Mins</option>
                        <option>1 Hour</option>
                        <option>Permanent</option>
                      </select>
                      <button className="btn-action btn-red" onClick={() => blockUser(u.username)}>BLOCK USER</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ManageUsers;
