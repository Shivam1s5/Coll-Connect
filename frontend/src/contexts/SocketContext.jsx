import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user && user.username) {
      const newSocket = io(backendUrl);
      
      newSocket.on('connect', () => {
        newSocket.emit('register-active', user.username);
      });

      newSocket.on('account-deleted', () => {
        alert('Your account has been permanently deleted by the Superadmin.');
        if (logout) logout();
        window.location.href = '/';
      });

      newSocket.on('deletion-request-dismissed', () => {
        alert('Your account deletion request was dismissed by the Superadmin.');
        window.location.reload();
      });

      setSocket(newSocket);
      return () => newSocket.close();
    }
  }, [user, logout]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
