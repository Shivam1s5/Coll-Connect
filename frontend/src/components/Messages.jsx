import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useToast } from '../contexts/ToastContext';
import { Search, Send, User, Check, X, Clock, MessageCircle } from 'lucide-react';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const Messages = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { socket } = useSocket();
  const { showToast } = useToast();

  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' or 'requests'
  const [activeChatUser, setActiveChatUser] = useState(null); // The user object we are chatting with
  const [chatHistory, setChatHistory] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isFetchingChat, setIsFetchingChat] = useState(false);

  const chatScrollRef = useRef(null);

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
        setFriends(data.friendsList || []);
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
      // TODO: Re-order inbox to bring sender to top (Optional enhancement)
    };

    const handleRequestReceived = () => {
      fetchProfileData(); // Refresh to get the new request
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
        performSearch(); // Refresh search results to update UI
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
        fetchProfileData(); // Refresh inbox and requests
      } else {
        showToast(`Failed to ${action} request`);
      }
    } catch (err) {
      showToast('Server error');
    }
  };

  // Chat logic
  const openChat = async (user) => {
    setActiveChatUser(user);
    setIsFetchingChat(true);
    setSearchQuery(''); // Clear search when opening a chat
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
    e.preventDefault();
    if (!messageInput.trim() || !activeChatUser || !socket) return;

    const tempId = Date.now().toString();
    const msgData = {
      id: tempId,
      to: activeChatUser.username,
      text: messageInput.trim(),
      type: 'text'
    };

    socket.emit('private-message', msgData);
    
    // Optimistic UI update
    setChatHistory(prev => [...prev, {
      id: tempId,
      sender: authUser.username,
      receiver: activeChatUser.username,
      text: messageInput.trim(),
      type: 'text',
      timestamp: new Date()
    }]);
    
    setMessageInput('');
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 50);
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
                        <h4 onClick={() => navigate(`/user/${u.username}`)} style={{ margin: 0, fontSize: '1rem', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.username}</h4>
                        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{u.role === 'superadmin' ? 'Superadmin' : u.gender}</span>
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
                        <h4 onClick={() => navigate(`/user/${req.username}`)} style={{ margin: 0, fontSize: '1.1rem', cursor: 'pointer' }}>{req.username}</h4>
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
                      <h4 style={{ margin: 0, fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.username}</h4>
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#111827' }}>
        {activeChatUser ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #374151', display: 'flex', alignItems: 'center', background: '#1f2937' }}>
              <div onClick={() => navigate(`/user/${activeChatUser.username}`)} style={{ cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', background: '#4b5563', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeChatUser.profilePic ? <img src={activeChatUser.profilePic} alt={activeChatUser.username} style={{width: '100%', height: '100%', objectFit: 'cover'}}/> : <User size={20} color="#9ca3af" />}
              </div>
              <div style={{ marginLeft: '12px' }}>
                <h3 onClick={() => navigate(`/user/${activeChatUser.username}`)} style={{ margin: 0, cursor: 'pointer' }}>{activeChatUser.username}</h3>
                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{activeChatUser.role === 'superadmin' ? 'Superadmin' : 'Friend'}</span>
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
                        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>{msg.text}</p>
                        <span style={{ fontSize: '0.65rem', color: isMe ? '#bfdbfe' : '#9ca3af', display: 'block', textAlign: 'right', marginTop: '4px' }}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input */}
            <div style={{ padding: '20px 24px', background: '#1f2937', borderTop: '1px solid #374151' }}>
              <form onSubmit={sendMessage} style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  placeholder="Message..." 
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  style={{ flex: 1, padding: '12px 20px', borderRadius: '24px', border: '1px solid #4b5563', background: '#111827', color: '#f3f4f6', outline: 'none', fontSize: '0.95rem' }}
                />
                <button type="submit" disabled={!messageInput.trim()} style={{ background: messageInput.trim() ? '#3b82f6' : '#374151', color: messageInput.trim() ? '#fff' : '#9ca3af', border: 'none', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: messageInput.trim() ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}>
                  <Send size={18} style={{ marginLeft: '2px' }} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid #374151', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <MessageCircle size={40} />
            </div>
            <h3 style={{ margin: '0 0 10px 0', color: '#f3f4f6' }}>Your Messages</h3>
            <p style={{ margin: 0 }}>Send private messages to a friend.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
