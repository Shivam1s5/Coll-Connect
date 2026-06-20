import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-500 cursor-pointer" onClick={() => navigate('/app')}>
          Coll-Connect
        </h1>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span>{user.name}</span>
              {user.role === 'admin' && (
                <button onClick={() => navigate('/app/admin')} className="text-gray-300 hover:text-white">
                  Admin
                </button>
              )}
              {user.role === 'superadmin' && (
                <button onClick={() => navigate('/app/superadmin')} className="text-gray-300 hover:text-white">
                  SuperAdmin
                </button>
              )}
              <button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <button 
              onClick={() => navigate('/auth')}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
