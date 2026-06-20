import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import VideoRoom from './components/VideoRoom';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import AdminPage from './components/AdminPage';
import SuperAdminPage from './components/SuperAdminPage';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';
import Layout from './components/Layout';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Main Application */}
              <Route path="/app" element={<Layout />}>
                <Route index element={<VideoRoom />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="superadmin" element={<SuperAdminPage />} />
              </Route>
            </Routes>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;