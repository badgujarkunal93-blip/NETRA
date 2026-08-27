import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Development bypass
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    // Mock user for development
    const mockUser = {
      id: "mock-id-123",
      auth_user_id: "auth-mock-123",
      name: "Mock Officer",
      badge: "CIU-001",
      role: "admin",
      unit: "CIU Core",
      is_active: true
    };
    setUser(mockUser);
    return true;
  };

  const logout = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: Boolean(user), isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
