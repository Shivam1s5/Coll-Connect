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

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <div className="app-container">
            <div className="main-content">
              <Router>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/app" element={<VideoRoom />} />
                  <Route path="/app/admin" element={<AdminPage />} />
                  <Route path="/app/superadmin" element={<SuperAdminPage />} />
                </Routes>
              </Router>
            </div>
          </div>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;