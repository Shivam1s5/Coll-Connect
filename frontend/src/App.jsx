import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import VideoRoom from './components/VideoRoom';
import AuthPage from './components/AuthPage';
import SuperAdminDashboard from './components/superadmin/SuperAdminDashboard';
import ManageUsers from './components/superadmin/ManageUsers';
import SupportTickets from './components/superadmin/SupportTickets';
import Announcements from './components/superadmin/Announcements';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AuthGuard from './components/auth/AuthGuard';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <Routes>
              {/* Standalone Auth Route */}
              <Route path="/auth" element={<AuthPage />} />

              {/* App Layout Routes */}
              <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
                <Route index element={<Dashboard />} />
                <Route path="chat" element={<VideoRoom />} />
                <Route path="messages" element={<div style={{padding: '20px', color: 'white'}}>Messages & Friends feature coming soon!</div>} />
                
                {/* Superadmin Routes */}
                <Route path="superadmin" element={<AuthGuard requiredRoles={['superadmin']}><SuperAdminDashboard /></AuthGuard>} />
                <Route path="superadmin/users" element={<AuthGuard requiredRoles={['superadmin']}><ManageUsers /></AuthGuard>} />
                <Route path="superadmin/tickets" element={<AuthGuard requiredRoles={['superadmin']}><SupportTickets /></AuthGuard>} />
                <Route path="superadmin/announcements" element={<AuthGuard requiredRoles={['superadmin']}><Announcements /></AuthGuard>} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
