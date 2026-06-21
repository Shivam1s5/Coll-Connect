import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const VideoRoom = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [partnerUsername, setPartnerUsername] = useState('');
  const [partnerRole, setPartnerRole] = useState('USER');
  const [partnerBlurred, setPartnerBlurred] = useState(true);

  const [mediaError, setMediaError] = useState(false);
  
  // Local controls state
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [isBlurred, setIsBlurred] = useState(true);

  // Friend status: 'none', 'sent', 'received', 'friends'
  const [friendStatus, setFriendStatus] = useState('none');

  // Ad banner state
  const [showAd, setShowAd] = useState(true);

  // Chat height state
  const [chatHeight, setChatHeight] = useState(250);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  // Stop media tracks when leaving the page
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (socket) {
        socket.emit('skip');
      }
    };
  }, [socket]);

  // Request camera access on mount
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error("Media error:", err);
        setMediaError(true);
      });
  }, []);

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
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
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    socket.on('partner-found', () => {
      setPartnerConnected(true);
      setShowAd(false);
      setMessages([{ text: "You're now chatting with stranger.", system: true }]);
      setPartnerBlurred(true);
      setFriendStatus('none');
    });

    socket.on('partner-username', (data) => {
      setPartnerUsername(data.username);
      if (data.username.toLowerCase() === 'admin' || data.role === 'admin' || data.role === 'superadmin') {
        setPartnerRole('ADMIN');
      } else {
        setPartnerRole('USER');
      }
      setMessages([{ text: `You're now chatting with ${data.username}.`, system: true }]);
    });

    socket.on('chat-message', (msg) => {
      setMessages(prev => [...prev, { text: msg, sender: 'stranger' }]);
      scrollToBottom();
    });

    socket.on('blur-state-change', (blurred) => {
      setPartnerBlurred(blurred);
    });

    socket.on('friend-request-received', (fromUsername) => {
      if (partnerUsername === fromUsername || partnerConnected) {
        setFriendStatus('received');
        showToast(`${fromUsername} sent you a friend request!`);
      }
    });

    socket.on('friend-request-accepted', (fromUsername) => {
      if (partnerUsername === fromUsername || partnerConnected) {
        setFriendStatus('friends');
        showToast(`You and ${fromUsername} are now friends!`);
      }
    });

    socket.on('friend-request-declined', (fromUsername) => {
      if (partnerUsername === fromUsername || partnerConnected) {
        setFriendStatus('none');
        showToast(`${fromUsername} declined your friend request.`);
      }
    });

    socket.on('initiate-offer', async () => {
      createPeerConnection();
      try {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        socket.emit('offer', offer);
      } catch (err) { console.error(err); }
    });

    socket.on('offer', async (offer) => {
      createPeerConnection();
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit('answer', answer);
      } catch (err) { console.error(err); }
    });

    socket.on('answer', async (answer) => {
      if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== 'stable') {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('ice-candidate', async (candidate) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on('partner-disconnected', () => {
      handlePartnerDisconnect();
    });

    return () => {
      socket.off('partner-found');
      socket.off('partner-username');
      socket.off('chat-message');
      socket.off('blur-state-change');
      socket.off('friend-request-received');
      socket.off('friend-request-accepted');
      socket.off('friend-request-declined');
      socket.off('initiate-offer');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('partner-disconnected');
    };
  }, [socket, createPeerConnection, partnerConnected, partnerUsername, showToast]);

  const handlePartnerDisconnect = () => {
    setPartnerConnected(false);
    setPartnerUsername('');
    setPartnerRole('USER');
    setFriendStatus('none');
    setShowAd(true);
    setMessages([{ text: 'Stranger has disconnected.', system: true }]);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const handleNext = () => {
    if (socket && user) {
      handlePartnerDisconnect();
      setMessages([{ text: 'Looking for a stranger...', system: true }]);
      socket.emit('find-partner', { myGender: 'Any', interestedIn: 'Any', username: user.username });
    }
  };

  const handleStop = () => {
    if (socket) {
      socket.emit('skip');
      handlePartnerDisconnect();
      setMessages([{ text: 'You have disconnected.', system: true }]);
    }
  };

  // Keyboard shortcut for Next (Spacebar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [socket, user]); // Dependencies for handleNext

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !micOn;
      });
      setMicOn(!micOn);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !videoOn;
      });
      setVideoOn(!videoOn);
    }
  };

  const toggleBlur = () => {
    const newBlurState = !isBlurred;
    setIsBlurred(newBlurState);
    if (socket && partnerConnected) {
      socket.emit('blur-state-change', newBlurState);
    }
  };

  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      setTimeout(() => {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
      }, 50);
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

  // Friend Request Functions
  const sendFriendRequest = async () => {
    if (!partnerUsername) return;
    try {
      const res = await fetch(`${backendUrl}/api/friend-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ targetUsername: partnerUsername })
      });
      const data = await res.json();
      if (res.ok) {
        setFriendStatus('sent');
        showToast('Friend request sent!');
      } else {
        showToast(data.error || 'Failed to send request', 'error');
      }
    } catch (err) { console.error(err); }
  };

  const acceptFriendRequest = async () => {
    if (!partnerUsername) return;
    try {
      const res = await fetch(`${backendUrl}/api/friend-accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ targetUsername: partnerUsername })
      });
      if (res.ok) {
        setFriendStatus('friends');
        showToast(`You and ${partnerUsername} are now friends!`);
      }
    } catch (err) { console.error(err); }
  };

  const declineFriendRequest = async () => {
    if (!partnerUsername) return;
    try {
      const res = await fetch(`${backendUrl}/api/friend-decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ targetUsername: partnerUsername })
      });
      if (res.ok) {
        setFriendStatus('none');
        showToast('Request declined.');
      }
    } catch (err) { console.error(err); }
  };

  const handleReport = () => {
    if (!partnerUsername) return;
    // Assuming Report Modal triggers somehow, could pass via context or state
    // Let's use a simple prompt for now, or you can implement the full screenshot logic if needed
    const reason = window.prompt(`Report ${partnerUsername} for what reason?`);
    if (reason && socket) {
      socket.emit('report-user', { reason, partnerUsername, screenshot: null });
      showToast('Report submitted successfully.');
    }
  };

  return (
    <div className="video-room-container">
      <div className="video-section">
        <div className="video-grid">
          {/* Local Video Box (Left) */}
          <div className="video-box local-video">
            <div className="user-badge">
              <span className="username">{user?.username}</span>
              <span className={`role-badge ${user?.role === 'superadmin' ? 'superadmin' : user?.role === 'admin' ? 'admin' : ''}`}>
                {user?.role?.toUpperCase()}
              </span>
            </div>
            {mediaError ? (
              <div className="video-error-text">
                Camera/Microphone Error.<br/>Check permissions.
              </div>
            ) : (
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className={isBlurred ? 'blurred-video' : ''}
              />
            )}
          </div>

          {/* Remote Video Box (Right) */}
          <div className="video-box remote-video">
            {!partnerConnected ? (
              <div className="waiting-overlay">
                <div className="spinner"></div>
                <div className="waiting-text">
                  <h3>Chatting with Stranger</h3>
                  <p>Looking for a stranger...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="user-badge">
                  <span className="username">{partnerUsername || 'user'}</span>
                  <span className={`role-badge ${partnerRole === 'ADMIN' ? 'admin' : partnerRole === 'SUPERADMIN' ? 'superadmin' : ''}`}>
                    {partnerRole}
                  </span>
                </div>
                <video 
                  ref={remoteVideoRef} 
                  autoPlay 
                  playsInline 
                  className={partnerBlurred ? 'blurred-video' : ''}
                />
              </>
            )}
          </div>
        </div>

        {/* Controls Row */}
        <div className="video-controls">
          <button 
            className={`control-btn ${micOn ? 'btn-purple' : 'btn-red'}`} 
            onClick={toggleMic}
          >
            {micOn ? 'MIC ON' : 'MIC OFF'}
          </button>
          
          <button 
            className={`control-btn ${videoOn ? 'btn-purple' : 'btn-red'}`} 
            onClick={toggleVideo}
          >
            {videoOn ? 'VIDEO ON' : 'VIDEO OFF'}
          </button>
          
          <button 
            className={`control-btn ${isBlurred ? 'btn-red' : 'btn-purple'}`} 
            onClick={toggleBlur}
          >
            {isBlurred ? 'UNBLUR FACE' : 'BLUR FACE'}
          </button>

          {/* Friend Request Logic */}
          {partnerConnected && partnerUsername && (
            <>
              {friendStatus === 'none' && (
                <button className="control-btn btn-yellow" onClick={sendFriendRequest}>ADD FRIEND</button>
              )}
              {friendStatus === 'sent' && (
                <button className="control-btn btn-gray" disabled>REQUEST SENT</button>
              )}
              {friendStatus === 'received' && (
                <>
                  <button className="control-btn btn-blue" onClick={acceptFriendRequest}>ACCEPT REQUEST</button>
                  <button className="control-btn btn-red" onClick={declineFriendRequest}>DECLINE</button>
                </>
              )}
              {friendStatus === 'friends' && (
                <button className="control-btn btn-green" disabled>FRIENDS</button>
              )}
            </>
          )}

          <button className="control-btn btn-red" onClick={handleReport}>REPORT</button>
          <button className="control-btn btn-red" onClick={handleStop}>STOP</button>
          <button className="control-btn btn-purple" onClick={handleNext}>NEXT (SPACE)</button>
        </div>
      </div>

      {/* Chat Section */}
      <div className="chat-section" style={{ height: `${chatHeight}px` }}>
        <div className="chat-resizer">
          <label>Chat Size: </label>
          <input 
            type="range" 
            min="150" 
            max="600" 
            value={chatHeight} 
            onChange={(e) => setChatHeight(e.target.value)}
            style={{ width: '150px' }}
          />
        </div>
        {showAd ? (
          <div className="ad-banner">
            <p>Google Ads Placeholder</p>
            <span>Advertisement</span>
          </div>
        ) : (
          <div className="chat-messages" ref={chatMessagesRef}>
            {messages.map((msg, idx) => (
              msg.system ? (
                <div key={idx} className="system-msg">{msg.text}</div>
              ) : (
                <div key={idx} className={`chat-msg ${msg.sender}`}>
                  <span className="msg-bubble">{msg.text}</span>
                </div>
              )
            ))}
          </div>
        )}
        
        <form className="chat-input-area" onSubmit={sendMessage}>
          <button type="button" className="icon-btn">😀</button>
          <button type="button" className="icon-btn gif-btn">GIF</button>
          <input
            type="text"
            className="chat-input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={!partnerConnected}
          />
          <button type="submit" className="send-btn" disabled={!inputMessage.trim() || !partnerConnected}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default VideoRoom;
