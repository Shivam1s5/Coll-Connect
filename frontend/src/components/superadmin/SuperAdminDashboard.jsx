import React, { useState, useEffect } from 'react';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({ totalUsers: 0, admins: 0, pendingReports: 0 });

  useEffect(() => {
    // We can fetch stats from /api/admin/users
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const users = data.users || [];
        setStats({
          totalUsers: users.length,
          admins: users.filter(u => u.role === 'admin' || u.role === 'superadmin').length,
          pendingReports: data.reports ? data.reports.filter(r => r.status === 'pending').length : 0
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="manage-users-container">
      <h2>Superadmin Dashboard</h2>
      <p style={{color: '#9ca3af', marginBottom: '30px'}}>Welcome to the control center.</p>
      
      <div className="stats-grid" style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
        <div className="stat-card" style={{background: '#1a2035', padding: '20px', borderRadius: '12px', flex: 1, minWidth: '200px', border: '1px solid #2a314d'}}>
          <h3 style={{color: '#9ca3af', fontSize: '0.9rem'}}>Total Users</h3>
          <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginTop: '10px'}}>{stats.totalUsers}</div>
        </div>
        <div className="stat-card" style={{background: '#1a2035', padding: '20px', borderRadius: '12px', flex: 1, minWidth: '200px', border: '1px solid #2a314d'}}>
          <h3 style={{color: '#9ca3af', fontSize: '0.9rem'}}>Admins</h3>
          <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6', marginTop: '10px'}}>{stats.admins}</div>
        </div>
        <div className="stat-card" style={{background: '#1a2035', padding: '20px', borderRadius: '12px', flex: 1, minWidth: '200px', border: '1px solid #2a314d'}}>
          <h3 style={{color: '#9ca3af', fontSize: '0.9rem'}}>Pending Reports</h3>
          <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444', marginTop: '10px'}}>{stats.pendingReports}</div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
