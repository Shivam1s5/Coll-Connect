import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomDropdown from './CustomDropdown';

const LandingPage = () => {
  const navigate = useNavigate();
  const [gender, setGender] = useState('Male');
  const [lookingFor, setLookingFor] = useState('Anyone');

  return (
    <div className="landing-page">
      <div className="app-navbar">
        <div className="navbar-brand">
          <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Coll-Connect</h1>
        </div>
        <div className="navbar-profile">
          <button className="btn" onClick={() => navigate('/auth')}>Login / Register</button>
        </div>
      </div>

      <div className="content-wrapper" style={{ alignItems: 'center' }}>
        <div className="landing-left">
          <div className="hero-section">
            <h2>Connect with Strangers instantly.</h2>
            <p>Meet new people, talk to strangers, and make friends instantly with our secure random video chat platform.</p>
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => navigate('/app')}
                className="btn"
                style={{ borderRadius: '25px', padding: '0.8rem 2rem' }}
              >
                START CHATTING
              </button>
            </div>
          </div>
        </div>
        
        <div className="landing-right">
          <div className="glass-panel preferences-card">
             <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Chat Preferences</h3>
             
             <div className="form-group">
                <label>I am:</label>
                <CustomDropdown 
                  options={['Male', 'Female']} 
                  selected={gender} 
                  onSelect={setGender} 
                />
             </div>
             
             <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label>Looking for:</label>
                <CustomDropdown 
                  options={['Anyone', 'Male', 'Female']} 
                  selected={lookingFor} 
                  onSelect={setLookingFor} 
                />
             </div>
             
             <button 
               className="btn" 
               style={{ width: '100%', marginTop: '2.5rem', borderRadius: '10px', padding: '0.8rem' }} 
               onClick={() => navigate('/app', { state: { gender, lookingFor } })}
             >
               FIND MATCH
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
