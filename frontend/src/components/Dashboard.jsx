import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-left">
          <h1 className="welcome-text">
            Welcome back,<br />
            {user?.username || 'user'}
          </h1>
          <p className="welcome-subtext">
            Connect with random people online completely anonymously.<br />
            Experience a fast, secure, and vibrant video chat environment.
          </p>
        </div>
        
        <div className="dashboard-right">
          <div className="chat-prefs-card">
            <h2 className="prefs-title">Chat Preferences</h2>
            
            <div className="prefs-form">
              <div className="prefs-group">
                <label>Interested in:</label>
                <div className="select-wrapper">
                  <select defaultValue="Any Gender">
                    <option>Any Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
              </div>
              
              <button 
                className="start-chat-btn"
                onClick={() => navigate('/chat')}
              >
                START VIDEO CHAT
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
