import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';

const VideoRoom = () => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const peerConnectionRef = useRef(null);

  useEffect(() => {
    // Media access
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error("Media error:", err);
        setMediaError(true);
      });

    if (socket) {
      socket.on('partner-found', () => {
        setPartnerConnected(true);
        setMessages([{ text: "You're now chatting with a random stranger.", system: true }]);
      });

      socket.on('chat-message', (msg) => {
        setMessages(prev => [...prev, { text: msg, sender: 'stranger' }]);
        scrollToBottom();
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
        if (peerConnectionRef.current.signalingState !== 'stable') {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      socket.on('ice-candidate', async (candidate) => {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      socket.on('partner-disconnected', () => {
        setPartnerConnected(false);
        setMessages(prev => [...prev, { text: 'Stranger has disconnected.', system: true }]);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('partner-found');
        socket.off('chat-message');
        socket.off('initiate-offer');
        socket.off('offer');
        socket.off('answer');
        socket.off('ice-candidate');
        socket.off('partner-disconnected');
      }
    };
  }, [socket]);

  const createPeerConnection = () => {
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) socket.emit('ice-candidate', event.candidate);
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Note: To stream local video to partner we need to add tracks:
    // But since localStreamRef isn't currently saved in state, we'll need to grab the stream from the video element or re-request it.
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => {
        pc.addTrack(track, localVideoRef.current.srcObject);
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

  const handleNext = () => {
    if (socket) {
      setPartnerConnected(false);
      setMessages([{ text: 'Looking for someone you can chat with...', system: true }]);
      socket.emit('find-partner', { myGender: 'Any', interestedIn: 'Any' });
    }
  };

  const handleStop = () => {
    if (socket) {
      socket.emit('skip');
      setPartnerConnected(false);
      setMessages([{ text: 'You have disconnected.', system: true }]);
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

  return (
    <div className="video-room-container">
      <div className="video-section">
        <div className="video-grid">
          {/* Remote Video Box */}
          <div className="video-box">
            <video ref={remoteVideoRef} autoPlay playsInline />
            {!partnerConnected && <div className="video-error-text">Waiting for partner...</div>}
          </div>
          
          {/* Local Video Box */}
          <div className="video-box">
            {mediaError ? (
              <div className="video-error-text">
                Error accessing<br/>camera/microphone.<br/>Please allow<br/>permissions.
              </div>
            ) : (
              <video ref={localVideoRef} autoPlay playsInline muted />
            )}
          </div>
        </div>

        <div className="video-controls">
          <button className="control-btn blue">Mic On</button>
          <button className="control-btn blue">Video On</button>
          <button className="control-btn red" onClick={handleStop}>Stop</button>
          <button className="control-btn blue" onClick={handleNext}>Next</button>
        </div>
      </div>

      <div className="chat-section">
        <div className="chat-messages" ref={chatMessagesRef}>
          {messages.map((msg, idx) => (
            msg.system ? (
              <div key={idx} className="system-msg">{msg.text}</div>
            ) : (
              <div key={idx} className={`chat-msg ${msg.sender}`}>{msg.text}</div>
            )
          ))}
        </div>
        
        <form className="chat-input-area" onSubmit={sendMessage}>
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
