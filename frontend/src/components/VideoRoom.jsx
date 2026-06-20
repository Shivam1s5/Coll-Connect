import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const VideoRoom = () => {
  const [socket, setSocket] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [partnerConnected, setPartnerConnected] = useState(false);
  
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    const newSocket = io(backendUrl);
    setSocket(newSocket);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch(err => console.error("Error accessing media devices.", err));

    newSocket.on('chat message', (msg) => {
      setMessages(prev => [...prev, { text: msg, sender: 'partner' }]);
    });

    newSocket.on('partner left', () => {
      setPartnerConnected(false);
      setMessages(prev => [...prev, { text: 'Partner disconnected.', system: true }]);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    });

    return () => newSocket.close();
  }, []);

  const handleNext = () => {
    if (socket) {
      socket.emit('find partner');
      setMessages([]);
      setPartnerConnected(false);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && socket) {
      socket.emit('chat message', inputMessage);
      setMessages(prev => [...prev, { text: inputMessage, sender: 'me' }]);
      setInputMessage('');
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-white">
      {/* Video Section */}
      <div className="flex-1 p-4 flex flex-col gap-4">
        <div className="flex-1 bg-black rounded-lg overflow-hidden relative">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          {!partnerConnected && (
             <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
               <span className="text-xl">Waiting for partner...</span>
             </div>
          )}
        </div>
        <div className="flex-1 bg-black rounded-lg overflow-hidden relative">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="absolute bottom-4 left-4 flex gap-2">
            <button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-full font-bold">
              Next / Skip
            </button>
          </div>
        </div>
      </div>

      {/* Chat Section */}
      <div className="w-full md:w-96 bg-gray-800 flex flex-col border-l border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Chat</h2>
        </div>
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2">
          {messages.map((msg, idx) => (
            <div key={idx} className={`p-2 rounded max-w-[80%] ${msg.system ? 'bg-gray-600 self-center text-sm' : msg.sender === 'me' ? 'bg-blue-600 self-end' : 'bg-gray-700 self-start'}`}>
              {msg.text}
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} className="p-4 border-t border-gray-700 flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold">
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default VideoRoom;
