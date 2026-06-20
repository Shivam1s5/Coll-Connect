import React from 'react';
import { useAuth } from '../hooks/useAuth';
import AuthGuard from './auth/AuthGuard';
import SuperAdminDashboard from './superadmin/SuperAdminDashboard';

const SuperAdminPage = () => {
  const { user } = useAuth();

  return (
    <AuthGuard requiredRoles={['superadmin']}>
      <div className="min-h-screen bg-gray-50">
        {/* Super Admin Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Super Admin Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage all organizations and system-wide settings
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {user?.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    Super Administrator
                  </div>
                </div>
                
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm uppercase">
                    {user?.name?.charAt(0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SuperAdminDashboard />
        </main>
      </div>
    </AuthGuard>
  );
};

export default SuperAdminPage;