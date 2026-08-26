import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const DEFAULT_OFFICER = {
  id: 'OFF-4029',
  name: 'Insp. Vikram Kadam',
  badge: 'MH-CIU-4029',
  role: 'Senior Intelligence Officer',
  unit: 'Crime Intelligence Unit (CIU), Mumbai Police',
  email: 'vikram.kadam@mumbaipolice.gov.in',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sih_auth_user');
    return saved ? JSON.parse(saved) : DEFAULT_OFFICER;
  });

  const login = (email, password) => {
    // For demo/prototype, authenticate and set user
    const officer = {
      ...DEFAULT_OFFICER,
      email: email || DEFAULT_OFFICER.email
    };
    setUser(officer);
    localStorage.setItem('sih_auth_user', JSON.stringify(officer));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sih_auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
