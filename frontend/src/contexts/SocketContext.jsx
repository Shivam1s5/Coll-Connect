import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.username) {
      const newSocket = io(backendUrl);
      
      newSocket.on('connect', () => {
        newSocket.emit('register-active', user.username);
      });

      setSocket(newSocket);
      return () => newSocket.close();
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
