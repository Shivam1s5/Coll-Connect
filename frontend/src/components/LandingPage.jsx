import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="app-navbar">
        <div className="navbar-brand">
          <h1>Coll-Connect</h1>
        </div>
        <div className="navbar-profile">
          <button className="btn" onClick={() => navigate('/auth')}>Login</button>
        </div>
      </div>

      <div className="content-wrapper">
        <div className="landing-left">
          <div className="hero-section">
            <h2>Connect with Strangers instantly.</h2>
            <p>Meet new people, talk to strangers, and make friends instantly with our secure random video chat platform.</p>
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => navigate('/app')}
                className="btn"
              >
                Start Chatting
              </button>
            </div>
          </div>
        </div>
        
        <div className="landing-right">
          <div className="glass-panel preferences-card">
             <h3 style={{ marginBottom: '1rem' }}>Chat Preferences</h3>
             <div className="form-group">
                <label>I am:</label>
                <select>
                  <option>Male</option>
                  <option>Female</option>
                </select>
             </div>
             <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Looking for:</label>
                <select>
                  <option>Anyone</option>
                  <option>Female</option>
                  <option>Male</option>
                </select>
             </div>
             <button className="btn" style={{ width: '100%', marginTop: '2rem' }} onClick={() => navigate('/app')}>
               Find Match
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
