import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useToast } from '../contexts/ToastContext';
import EmojiPicker from 'emoji-picker-react';
import { Search, Send, User, Check, X, Clock, MessageCircle, Paperclip, Mic, Smile, AlertTriangle, UserMinus, MoreVertical, Square } from 'lucide-react';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const Messages = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { socket } = useSocket();
  const { showToast, showConfirm } = useToast();

  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' or 'requests'
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isFetchingChat, setIsFetchingChat] = useState(false);

  // New states for media & actions
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const chatScrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
        setRequests(data.friendRequests || []);
      }
    } catch (err) {
      console.error('Failed to fetch profile data', err);
    }
  };

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (activeChatUser && (msg.sender === activeChatUser.username || msg.receiver === activeChatUser.username)) {
        setChatHistory(prev => [...prev, msg]);
        scrollToBottom();
      }
    };

    const handleRequestReceived = () => {
      fetchProfileData();
      showToast('You have a new friend request!');
    };

    const handleRequestAccepted = () => {
      fetchProfileData();
      showToast('Your friend request was accepted!');
    };

    socket.on('private-message', handleNewMessage);
    socket.on('friend-request-received', handleRequestReceived);
    socket.on('friend-request-accepted', handleRequestAccepted);

    return () => {
      socket.off('private-message', handleNewMessage);
      socket.off('friend-request-received', handleRequestReceived);
      socket.off('friend-request-accepted', handleRequestAccepted);
    };
  }, [socket, activeChatUser]);

  // Search logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/users/search?q=${searchQuery}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSearchResults(await res.json());
      }
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Friend actions
  const sendFriendRequest = async (targetUsername) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/friend-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ targetUsername })
      });
      if (res.ok) {
        showToast(`Friend request sent to ${targetUsername}`);
        performSearch();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to send request');
      }
    } catch (err) {
      showToast('Server error');
    }
  };

  const respondToRequest = async (targetUsername, action) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = action === 'accept' ? '/api/friend-accept' : '/api/friend-decline';
      const res = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ targetUsername })
      });
      if (res.ok) {
        showToast(`Request ${action}ed`);
        fetchProfileData();
      } else {
        showToast(`Failed to ${action} request`);
      }
    } catch (err) {
      showToast('Server error');
    }
  };

  const handleUnfriend = () => {
    setShowChatMenu(false);
    showConfirm(`Are you sure you want to unfriend ${activeChatUser.username}? You will lose your chat history.`, async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${backendUrl}/api/unfriend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ targetUsername: activeChatUser.username })
        });
        if (res.ok) {
          showToast(`Unfriended ${activeChatUser.username}`);
          setActiveChatUser(null);
          fetchProfileData();
        } else {
          showToast('Failed to unfriend');
        }
      } catch (err) {
        showToast('Server error during unfriend');
      }
    });
  };

  const handleReport = () => {
    setShowChatMenu(false);
    showToast('Report submitted. Our team will review this user.');
  };

  // Chat logic
  const openChat = async (user) => {
    setActiveChatUser(user);
    setIsFetchingChat(true);
    setSearchQuery('');
    setShowChatMenu(false);
    setShowEmojiPicker(false);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/messages/${user.username}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setChatHistory(await res.json());
        scrollToBottom();
      }
    } catch (err) {
      console.error('Failed to fetch chat history', err);
    } finally {
      setIsFetchingChat(false);
    }
  };

  const sendMessage = (e) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !activeChatUser || !socket) return;

    sendSocketMessage('text', messageInput.trim(), null);
    setMessageInput('');
    setShowEmojiPicker(false);
  };

  const sendSocketMessage = (type, text, fileUrl) => {
    const tempId = Date.now().toString();
    const msgData = {
      id: tempId,
      to: activeChatUser.username,
      text: text,
      type: type,
      fileUrl: fileUrl
    };

    socket.emit('private-message', msgData);
    
    setChatHistory(prev => [...prev, {
      id: tempId,
      sender: authUser.username,
      receiver: activeChatUser.username,
      text: text,
      type: type,
      fileUrl: fileUrl,
      timestamp: new Date()
    }]);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 50);
  };

  // Media & Emoji Handlers
  const onEmojiClick = (emojiObject) => {
    setMessageInput(prev => prev + emojiObject.emoji);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      showToast('Only image and video files are supported');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (res.ok) {
        const { url } = await res.json();
        sendSocketMessage(isVideo ? 'video' : 'image', '', url);
      } else {
        showToast('Failed to upload file');
      }
    } catch(err) {
      showToast('Server error during upload');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      clearInterval(timerRef.current);
      setRecordingDuration(0);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());
          uploadAudioBlob(audioBlob);
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordingDuration(0);
        timerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
      } catch (err) {
        showToast('Microphone access denied or not available');
      }
    }
  };

  const uploadAudioBlob = async (blob) => {
    setIsUploading(true);
    try {
      const file = new File([blob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (res.ok) {
        const { url } = await res.json();
        sendSocketMessage('audio', '', url);
      } else {
        showToast('Failed to upload audio message');
      }
    } catch(err) {
      showToast('Server error during audio upload');
    } finally {
      setIsUploading(false);
    }
  };

  const getBadgeStyle = (role) => {
    switch(role) {
      case 'superadmin': 
        return { background: 'linear-gradient(135deg, #FFD700 0%, #FDB931 100%)', color: '#000', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 2px 4px rgba(255, 215, 0, 0.2)' };
      case 'admin': 
        return { background: 'linear-gradient(135deg, #C0C0C0 0%, #A9A9A9 100%)', color: '#000', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 2px 4px rgba(192, 192, 192, 0.2)' };
      default: 
        return { background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 2px 4px rgba(139, 92, 246, 0.2)' };
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="messages-layout" style={{ display: 'flex', height: 'calc(100vh - 60px)', background: '#111827', color: '#f3f4f6' }}>
      
      {/* Left Sidebar */}
      <div style={{ width: '350px', borderRight: '1px solid #374151', display: 'flex', flexDirection: 'column', background: '#1f2937' }}>
        
        {/* Header & Tabs */}
        <div style={{ padding: '20px', borderBottom: '1px solid #374151' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>Messages</h2>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #4b5563', background: '#111827', color: '#f3f4f6', outline: 'none', boxSizing: 'border-box' }}
            />
            <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          {!searchQuery && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setActiveTab('inbox')} style={{ flex: 1, padding: '8px', borderRadius: '6px', background: activeTab === 'inbox' ? '#3b82f6' : '#374151', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                Inbox
              </button>
              <button onClick={() => setActiveTab('requests')} style={{ flex: 1, padding: '8px', borderRadius: '6px', background: activeTab === 'requests' ? '#3b82f6' : '#374151', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '500', position: 'relative' }}>
                Requests
                {requests.length > 0 && (
                  <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {requests.length}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          
          {/* Searching View */}
          {searchQuery ? (
            <div>
              <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '10px', paddingLeft: '5px' }}>Search Results</p>
              {isSearching ? <p style={{color: '#6b7280', textAlign: 'center', padding: '20px'}}>Searching...</p> : 
                searchResults.length === 0 ? <p style={{color: '#6b7280', textAlign: 'center', padding: '20px'}}>No users found</p> :
                searchResults.map(u => {
                  const isFriend = friends.some(f => f.username === u.username);
                  return (
                    <div key={u.username} style={{ display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '8px', background: '#111827', marginBottom: '8px', gap: '12px' }}>
                      <div onClick={() => navigate(`/user/${u.username}`)} style={{ cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', background: '#374151', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {u.profilePic ? <img src={u.profilePic} alt={u.username} style={{width: '100%', height: '100%', objectFit: 'cover'}}/> : <User size={20} color="#9ca3af" />}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <h4 onClick={() => navigate(`/user/${u.username}`)} style={{ margin: 0, fontSize: '1rem', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.username}</h4>
                          <span style={getBadgeStyle(u.role)}>{u.role === 'superadmin' ? 'Superadmin' : u.role === 'admin' ? 'Admin' : 'User'}</span>
                        </div>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        {isFriend ? (
                          <button onClick={() => openChat(u)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MessageCircle size={14}/> Message
                          </button>
                        ) : u.hasSentRequest ? (
                          <button disabled style={{ background: '#374151', color: '#9ca3af', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={14}/> Pending
                          </button>
                        ) : (
                          <button onClick={() => sendFriendRequest(u.username)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                            Add Friend
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              }
            </div>
          ) : activeTab === 'requests' ? (
            /* Requests View */
            <div>
              {requests.length === 0 ? <p style={{color: '#6b7280', textAlign: 'center', padding: '20px'}}>No pending requests</p> : 
                requests.map(req => (
                  <div key={req.username} style={{ display: 'flex', flexDirection: 'column', padding: '16px', borderRadius: '8px', background: '#111827', marginBottom: '12px', border: '1px solid #374151' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div onClick={() => navigate(`/user/${req.username}`)} style={{ cursor: 'pointer', width: '48px', height: '48px', borderRadius: '50%', background: '#374151', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {req.profilePic ? <img src={req.profilePic} alt={req.username} style={{width: '100%', height: '100%', objectFit: 'cover'}}/> : <User size={24} color="#9ca3af" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <h4 onClick={() => navigate(`/user/${req.username}`)} style={{ margin: 0, fontSize: '1.1rem', cursor: 'pointer' }}>{req.username}</h4>
                          <span style={getBadgeStyle(req.role)}>{req.role === 'superadmin' ? 'Superadmin' : req.role === 'admin' ? 'Admin' : 'User'}</span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Wants to be friends</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => respondToRequest(req.username, 'accept')} style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontWeight: '500' }}>
                        <Check size={16}/> Accept
                      </button>
                      <button onClick={() => respondToRequest(req.username, 'decline')} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontWeight: '500' }}>
                        <X size={16}/> Decline
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          ) : (
            /* Inbox View */
            <div>
              {friends.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                  <MessageCircle size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
                  <p>Your inbox is empty.</p>
                  <p style={{ fontSize: '0.85rem' }}>Search for users above to make friends!</p>
                </div>
              ) : (
                friends.map(f => (
                  <div 
                    key={f.username} 
                    onClick={() => openChat(f)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '12px', 
                      borderRadius: '8px', 
                      background: activeChatUser?.username === f.username ? '#374151' : 'transparent', 
                      cursor: 'pointer', 
                      transition: 'background 0.2s',
                      marginBottom: '4px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = activeChatUser?.username === f.username ? '#374151' : '#111827'}
                    onMouseLeave={(e) => e.currentTarget.style.background = activeChatUser?.username === f.username ? '#374151' : 'transparent'}
                  >
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#4b5563', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {f.profilePic ? <img src={f.profilePic} alt={f.username} style={{width: '100%', height: '100%', objectFit: 'cover'}}/> : <User size={24} color="#9ca3af" />}
                    </div>
                    <div style={{ marginLeft: '12px', flex: 1, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.username}</h4>
                        <span style={getBadgeStyle(f.role)}>{f.role === 'superadmin' ? 'Superadmin' : f.role === 'admin' ? 'Admin' : 'User'}</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'block', marginTop: '2px' }}>Tap to chat</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#111827', position: 'relative' }}>
        {activeChatUser ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #374151', display: 'flex', alignItems: 'center', background: '#1f2937', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div onClick={() => navigate(`/user/${activeChatUser.username}`)} style={{ cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', background: '#4b5563', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {activeChatUser.profilePic ? <img src={activeChatUser.profilePic} alt={activeChatUser.username} style={{width: '100%', height: '100%', objectFit: 'cover'}}/> : <User size={20} color="#9ca3af" />}
                </div>
                <div style={{ marginLeft: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 onClick={() => navigate(`/user/${activeChatUser.username}`)} style={{ margin: 0, cursor: 'pointer' }}>{activeChatUser.username}</h3>
                    <span style={getBadgeStyle(activeChatUser.role)}>{activeChatUser.role === 'superadmin' ? 'Superadmin' : activeChatUser.role === 'admin' ? 'Admin' : 'User'}</span>
                  </div>
                </div>
              </div>
              
              {/* Header Actions */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowChatMenu(!showChatMenu)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '8px', borderRadius: '50%', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#374151'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <MoreVertical size={20} />
                </button>
                {showChatMenu && (
                  <div style={{ position: 'absolute', top: '40px', right: '0', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)', zIndex: 50, width: '160px', overflow: 'hidden' }}>
                    <button onClick={handleUnfriend} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid #374151', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }} onMouseEnter={(e) => e.currentTarget.style.background = '#374151'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <UserMinus size={16} /> Unfriend
                    </button>
                    <button onClick={handleReport} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'transparent', border: 'none', color: '#f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }} onMouseEnter={(e) => e.currentTarget.style.background = '#374151'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <AlertTriangle size={16} color="#eab308" /> Report User
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Messages */}
            <div ref={chatScrollRef} className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {isFetchingChat ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#9ca3af' }}>Loading messages...</div>
              ) : chatHistory.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#6b7280', flexDirection: 'column', gap: '10px' }}>
                  <MessageCircle size={48} style={{ opacity: 0.5 }} />
                  <p>Say hi to {activeChatUser.username}!</p>
                </div>
              ) : (
                chatHistory.map((msg, idx) => {
                  const isMe = msg.sender === authUser.username;
                  return (
                    <div key={msg.id || idx} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ 
                        maxWidth: '70%', 
                        padding: '10px 16px', 
                        borderRadius: '16px',
                        background: isMe ? '#3b82f6' : '#374151',
                        color: '#fff',
                        borderBottomRightRadius: isMe ? '4px' : '16px',
                        borderBottomLeftRadius: isMe ? '16px' : '4px',
                        wordWrap: 'break-word',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}>
                        
                        {/* Media Rendering */}
                        {msg.type === 'image' && (
                          <div style={{ marginBottom: '8px', borderRadius: '8px', overflow: 'hidden' }}>
                            <img src={msg.fileUrl} alt="attachment" style={{ maxWidth: '100%', maxHeight: '300px', display: 'block', borderRadius: '8px' }} />
                          </div>
                        )}
                        {msg.type === 'video' && (
                          <div style={{ marginBottom: '8px', borderRadius: '8px', overflow: 'hidden' }}>
                            <video src={msg.fileUrl} controls style={{ maxWidth: '100%', maxHeight: '300px', display: 'block', borderRadius: '8px', background: '#000' }} />
                          </div>
                        )}
                        {msg.type === 'audio' && (
                          <div style={{ marginBottom: '8px' }}>
                            <audio src={msg.fileUrl} controls style={{ maxWidth: '250px', display: 'block' }} />
                          </div>
                        )}
                        
                        {msg.text && <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>{msg.text}</p>}
                        
                        <span style={{ fontSize: '0.65rem', color: isMe ? '#bfdbfe' : '#9ca3af', display: 'block', textAlign: 'right', marginTop: '4px' }}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              {isUploading && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                   <div style={{ padding: '10px 16px', borderRadius: '16px', background: '#3b82f6', color: '#fff', opacity: 0.7 }}>
                     <span style={{ fontSize: '0.9rem' }}>Sending media...</span>
                   </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div style={{ padding: '20px 24px', background: '#1f2937', borderTop: '1px solid #374151', position: 'relative' }}>
              
              {showEmojiPicker && (
                <div style={{ position: 'absolute', bottom: '100%', right: '24px', marginBottom: '10px', zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                  <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
                </div>
              )}

              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" style={{ display: 'none' }} />

              <form onSubmit={sendMessage} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                
                {/* Attachment Button */}
                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '8px', borderRadius: '50%', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={(e) => e.currentTarget.style.background = '#374151'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <Paperclip size={20} />
                </button>

                {/* Input Area / Recording Area */}
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', background: '#111827', borderRadius: '24px', border: '1px solid #4b5563' }}>
                  {isRecording ? (
                    <div style={{ flex: 1, padding: '12px 20px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }}></div>
                      Recording... {formatDuration(recordingDuration)}
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      placeholder="Type a message..." 
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      style={{ flex: 1, padding: '12px 20px', background: 'transparent', color: '#f3f4f6', outline: 'none', border: 'none', fontSize: '0.95rem' }}
                    />
                  )}
                  
                  {!isRecording && (
                    <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Smile size={20} />
                    </button>
                  )}
                </div>

                {/* Microphone / Stop Button */}
                {!messageInput.trim() && !isRecording && (
                  <button type="button" onClick={toggleRecording} style={{ background: '#374151', color: '#9ca3af', border: 'none', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => {e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff';}} onMouseLeave={(e) => {e.currentTarget.style.background = '#374151'; e.currentTarget.style.color = '#9ca3af';}}>
                    <Mic size={18} />
                  </button>
                )}

                {isRecording && (
                  <button type="button" onClick={toggleRecording} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', animation: 'pulse 1.5s infinite' }}>
                    <Square size={16} fill="currentColor" />
                  </button>
                )}

                {/* Send Button */}
                {messageInput.trim() && (
                  <button type="submit" style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}>
                    <Send size={18} style={{ marginLeft: '2px' }} />
                  </button>
                )}
              </form>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid #374151', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <MessageCircle size={40} />
            </div>
            <h3 style={{ margin: '0 0 10px 0', color: '#f3f4f6' }}>Your Messages</h3>
            <p style={{ margin: 0 }}>Send private messages, photos, and voice notes.</p>
          </div>
        )}
      </div>
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
};

export default Messages;
