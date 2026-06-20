import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../hooks/useAuth';

const VideoRoom = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const preferences = location.state || { gender: 'Any', lookingFor: 'Any' };
  
  const [inCall, setInCall] = useState(false);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isBlurred, setIsBlurred] = useState(false);
  const [partnerBlurred, setPartnerBlurred] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate Content');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const chatMessagesRef = useRef(null);

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    if (!socket) return;

    // Initialize media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error("Error accessing media devices.", err);
        alert("Camera and microphone access is required to use this app.");
      });

    // Socket Event Listeners
    socket.on('partner-found', () => {
      setPartnerConnected(true);
      setMessages([{ text: 'You are now connected with a stranger!', system: true }]);
    });

    socket.on('partner-username', (data) => {
      setPartnerInfo(data);
    });

    socket.on('initiate-offer', async () => {
      createPeerConnection();
      try {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        socket.emit('offer', offer);
      } catch (err) {
        console.error('Error creating offer', err);
      }
    });

    socket.on('offer', async (offer) => {
      createPeerConnection();
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit('answer', answer);
      } catch (err) {
        console.error('Error handling offer', err);
      }
    });

    socket.on('answer', async (answer) => {
      try {
        if (peerConnectionRef.current.signalingState !== 'stable') {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (err) {
        console.error('Error handling answer', err);
      }
    });

    socket.on('ice-candidate', async (candidate) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('Error adding ice candidate', err);
      }
    });

    socket.on('chat-message', (msg) => {
      setMessages(prev => [...prev, { text: msg, sender: 'stranger' }]);
      scrollToBottom();
    });

    socket.on('chat-reaction', (data) => {
      setMessages(prev => [...prev, { text: data.emoji, sender: 'stranger', isReaction: true }]);
      scrollToBottom();
    });

    socket.on('blur-state-change', (blurred) => {
      setPartnerBlurred(blurred);
    });

    socket.on('partner-disconnected', () => {
      handleDisconnect('Stranger has disconnected.');
    });

    return () => {
      socket.off('partner-found');
      socket.off('partner-username');
      socket.off('initiate-offer');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('chat-message');
      socket.off('chat-reaction');
      socket.off('blur-state-change');
      socket.off('partner-disconnected');
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [socket]);

  const createPeerConnection = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate);
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }
  };

  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      setTimeout(() => {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
      }, 50);
    }
  };

  const handleDisconnect = (msg) => {
    setPartnerConnected(false);
    setPartnerInfo(null);
    setPartnerBlurred(false);
    setMessages(prev => [...prev, { text: msg, system: true }]);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    scrollToBottom();
  };

  const handleNext = () => {
    if (socket) {
      handleDisconnect('Looking for someone you can chat with...');
      socket.emit('find-partner', { 
        myGender: preferences.gender, 
        interestedIn: preferences.lookingFor, 
        username: user?.name || 'Guest' 
      });
      setInCall(true);
    }
  };

  const handleStop = () => {
    if (socket) {
      socket.emit('skip');
      handleDisconnect('You have disconnected.');
      setInCall(false);
    }
  };

  const handleSkip = () => {
    if (socket) {
      socket.emit('skip');
      handleNext();
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && socket && partnerConnected) {
      socket.emit('chat-message', inputMessage);
      setMessages(prev => [...prev, { text: inputMessage, sender: 'self' }]);
      setInputMessage('');
      scrollToBottom();
    }
  };

  const sendReaction = (emoji) => {
    if (socket && partnerConnected) {
      socket.emit('chat-reaction', { emoji });
      setMessages(prev => [...prev, { text: emoji, sender: 'self', isReaction: true }]);
      scrollToBottom();
    }
  };

  const toggleBlur = () => {
    const newBlurState = !isBlurred;
    setIsBlurred(newBlurState);
    if (socket && partnerConnected) {
      socket.emit('blur-state-change', newBlurState);
    }
  };

  const takeScreenshot = () => {
    if (!remoteVideoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = remoteVideoRef.current.videoWidth;
    canvas.height = remoteVideoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(remoteVideoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
  };

  const handleReport = () => {
    if (socket && partnerConnected) {
      const screenshot = takeScreenshot();
      socket.emit('report-user', {
        reason: reportReason,
        partnerUsername: partnerInfo?.username,
        screenshot: screenshot
      });
      setShowReportModal(false);
      handleDisconnect('You reported the stranger. They have been disconnected.');
    }
  };

  return (
    <div className="center-content">
      <div className="content-wrapper">
        <div className="video-room">
          
          <div className="video-section glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
            <div className="video-grid">
              
              <div className="video-container">
                <div className="video-overlay">Stranger {partnerInfo ? `(${partnerInfo.gender})` : ''}</div>
                <video 
                  ref={remoteVideoRef} 
                  autoPlay 
                  playsInline 
                  style={{ filter: partnerBlurred ? 'blur(15px)' : 'none' }}
                />
                {!partnerConnected && (
                  <div className="status-bar">
                    <h3>{inCall ? 'Waiting...' : 'Ready?'}</h3>
                    <p>{inCall ? 'Searching for a partner based on your preferences' : 'Press Next to find a stranger'}</p>
                    {!inCall && (
                      <button className="btn" style={{ marginTop: '1rem' }} onClick={handleNext}>
                        START
                      </button>
                    )}
                  </div>
                )}
                {partnerConnected && (
                  <button 
                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(225,29,72,0.8)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.4rem 0.8rem', cursor: 'pointer', zIndex: 10 }}
                    onClick={() => setShowReportModal(true)}
                  >
                    Report
                  </button>
                )}
              </div>

              <div className="local-video-container">
                <div className="video-overlay">You</div>
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  style={{ filter: isBlurred ? 'blur(15px)' : 'none' }}
                />
                <button 
                  style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '0.4rem 0.8rem', cursor: 'pointer', zIndex: 10 }}
                  onClick={toggleBlur}
                >
                  {isBlurred ? 'Unblur' : 'Blur'}
                </button>
              </div>

            </div>

            <div className="controls-section glass-panel" style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.3)' }}>
              <button className="btn danger" onClick={handleStop} style={{ padding: '0.8rem 2rem' }}>Stop</button>
              <button className="btn" onClick={handleSkip} style={{ padding: '0.8rem 2rem' }}>Next / Skip</button>
            </div>
          </div>

          <div className="chat-section glass-panel">
            <div className="chat-messages" ref={chatMessagesRef}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`chat-message ${msg.system ? 'system' : msg.sender === 'self' ? 'self' : 'stranger'} ${msg.isReaction ? 'text-3xl bg-transparent' : ''}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            
            {partnerConnected && (
              <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.1)' }}>
                {['👍', '❤️', '😂', '👋'].map(emoji => (
                  <button 
                    key={emoji} 
                    onClick={() => sendReaction(emoji)}
                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={sendMessage} className="chat-input-container">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={!partnerConnected}
              />
              <button type="submit" className="send-btn" disabled={!inputMessage.trim() || !partnerConnected}>
                <svg className="send-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </form>
          </div>

        </div>
      </div>

      {showReportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--danger-color)' }}>Report User</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Are you sure you want to report this user? A screenshot will be sent to the admins.</p>
            
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label>Reason:</label>
              <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid var(--panel-border)' }}>
                <option>Inappropriate Content</option>
                <option>Harassment</option>
                <option>Spam</option>
                <option>Other</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)' }} onClick={() => setShowReportModal(false)}>Cancel</button>
              <button className="btn danger" onClick={handleReport}>Submit Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoRoom;
