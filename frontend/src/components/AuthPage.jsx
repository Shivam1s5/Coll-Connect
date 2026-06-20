import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const endpoint = isLogin ? '/api/login' : '/api/register';
    const payload = isLogin ? { email, password } : { email, username, password };

    try {
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server error. Please try again.');
      }

      login(data.token, { username: data.username, role: data.role });
      navigate('/');
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Server error. Please try again.' : err.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
      <p>{isLogin ? 'Log in to continue chatting.' : 'Sign up to meet strangers anonymously.'}</p>
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {!isLogin && (
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              className="auth-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
        )}
        
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className="error-text">{error}</div>}

        <button type="submit" className="btn-primary">
          {isLogin ? 'Log In' : 'Sign Up'}
        </button>
      </form>

      <div className="auth-switch">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Sign Up' : 'Log In'}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;
