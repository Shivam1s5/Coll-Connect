import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const VideoRoom = () => {
  const [socket, setSocket] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [partnerConnected, setPartnerConnected] = useState(false);
  
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const newSocket = io(backendUrl);
    setSocket(newSocket);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch(err => console.error("Error accessing media devices.", err));

    newSocket.on('chat message', (msg) => {
      setMessages(prev => [...prev, { text: msg, sender: 'stranger' }]);
    });

    newSocket.on('partner left', () => {
      setPartnerConnected(false);
      setMessages(prev => [...prev, { text: 'Stranger has disconnected.', system: true }]);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    });

    return () => newSocket.close();
  }, []);

  const handleNext = () => {
    if (socket) {
      socket.emit('find partner');
      setMessages([{ text: 'Looking for someone you can chat with...', system: true }]);
      setPartnerConnected(false);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    }
  };

  const handleStop = () => {
    if (socket) {
      socket.emit('stop call');
      setPartnerConnected(false);
      setMessages([{ text: 'You have disconnected.', system: true }]);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && socket) {
      socket.emit('chat message', inputMessage);
      setMessages(prev => [...prev, { text: inputMessage, sender: 'self' }]);
      setInputMessage('');
    }
  };

  return (
    <div className="center-content">
      <div className="app-navbar">
        <div className="navbar-brand">
          <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Coll-Connect</h1>
        </div>
      </div>
      
      <div className="content-wrapper">
        <div className="video-room">
          
          <div className="video-section glass-panel p-4">
            <div className="video-grid">
              
              <div className="video-container">
                <div className="video-overlay">Stranger</div>
                <video ref={remoteVideoRef} autoPlay playsInline />
                {!partnerConnected && (
                  <div className="status-bar">
                    <h3>Waiting...</h3>
                    <p>Press Next to find a stranger</p>
                  </div>
                )}
              </div>

              <div className="local-video-container">
                <div className="video-overlay">You</div>
                <video ref={localVideoRef} autoPlay playsInline muted />
              </div>

            </div>

            <div className="controls-section glass-panel">
              <button className="btn danger" onClick={handleStop} style={{ padding: '0.8rem 2rem' }}>Stop</button>
              <button className="btn" onClick={handleNext} style={{ padding: '0.8rem 2rem' }}>Next / Skip</button>
            </div>
          </div>

          <div className="chat-section glass-panel">
            <div className="chat-messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={`chat-message ${msg.system ? 'system' : msg.sender === 'self' ? 'self' : 'stranger'}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="chat-input-container">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
              />
              <button type="submit" className="send-btn" disabled={!inputMessage.trim()}>
                <svg className="send-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VideoRoom;
