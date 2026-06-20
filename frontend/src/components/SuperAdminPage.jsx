import React from 'react';
import { useAuth } from '../hooks/useAuth';
import AuthGuard from './auth/AuthGuard';
import SuperAdminDashboard from './superadmin/SuperAdminDashboard';

const SuperAdminPage = () => {
  const { user } = useAuth();

  return (
    <AuthGuard requiredRoles={['superadmin']}>
      <div className="center-content" style={{ padding: '2rem' }}>
        <div className="admin-page glass-panel" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '2rem' }}>Super Admin Portal</h2>
          <SuperAdminDashboard />
        </div>
      </div>
    </AuthGuard>
  );
};

export default SuperAdminPage;
