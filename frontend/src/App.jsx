import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import VideoRoom from './components/VideoRoom';
import AuthPage from './components/AuthPage';
import SuperAdminPage from './components/SuperAdminPage';
import Layout from './components/Layout';
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
              {/* App Layout Routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={
                  <AuthGuard>
                    <VideoRoom />
                  </AuthGuard>
                } />
                <Route path="auth" element={<AuthPage />} />
                <Route path="superadmin" element={<SuperAdminPage />} />
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
