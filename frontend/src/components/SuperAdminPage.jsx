import React from 'react';
import { useAuth } from '../hooks/useAuth';
import AuthGuard from './auth/AuthGuard';
import SuperAdminDashboard from './superadmin/SuperAdminDashboard';
import { useNavigate } from 'react-router-dom';

const SuperAdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <AuthGuard requiredRoles={['superadmin']}>
      <div className="center-content">
        <div className="app-navbar">
          <div className="navbar-brand">
            <h1 onClick={() => navigate('/app')} style={{ cursor: 'pointer' }}>Coll-Connect SuperAdmin</h1>
          </div>
          <div className="navbar-profile">
            <button className="btn" onClick={() => navigate('/app')}>Back to App</button>
          </div>
        </div>

        <div className="content-wrapper">
          <div className="admin-page glass-panel" style={{ width: '100%', marginTop: '2rem' }}>
            <h2 style={{ marginBottom: '2rem' }}>Super Admin Portal</h2>
            <SuperAdminDashboard />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default SuperAdminPage;