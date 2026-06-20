import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import AuthGuard from './auth/AuthGuard';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const AdminPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalUsers: 0, activeChats: 0 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const [statsRes, usersRes] = await Promise.all([
          fetch(`${backendUrl}/api/admin/stats`, { headers }),
          fetch(`${backendUrl}/api/admin/users`, { headers })
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());
      } catch (err) {
        console.error('Error fetching admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  return (
    <AuthGuard requiredRoles={['admin', 'superadmin']}>
      <div className="center-content" style={{ padding: '2rem' }}>
        <div className="admin-page glass-panel" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '2rem' }}>Admin Dashboard</h2>
          
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', flex: 1, textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-secondary)' }}>Total Users</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.totalUsers}</p>
            </div>
            <div className="glass-panel" style={{ padding: '2rem', flex: 1, textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-secondary)' }}>Active Chats</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.activeChats}</p>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>User Management</h2>
            {loading ? (
              <p>Loading users...</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '1rem' }}>Name</th>
                      <th style={{ padding: '1rem' }}>Email</th>
                      <th style={{ padding: '1rem' }}>Role</th>
                      <th style={{ padding: '1rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1rem' }}>{u.name}</td>
                        <td style={{ padding: '1rem' }}>{u.email}</td>
                        <td style={{ padding: '1rem' }}>{u.role}</td>
                        <td style={{ padding: '1rem' }}>
                          {u.role !== 'superadmin' && u.username !== user.username && (
                            <button className="btn danger" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Block</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default AdminPage;
