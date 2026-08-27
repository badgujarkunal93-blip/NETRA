import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          await fetchAndSetOfficer(session.user.id);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();

    // 2. Listen to state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchAndSetOfficer(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchAndSetOfficer = async (authUserId) => {
    try {
      const { data, error } = await supabase
        .from('officers')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (error || !data) {
        // If not found in officers table, they cannot use the app
        await supabase.auth.signOut();
        throw new Error("Account not authorized — contact CIU admin.");
      }

      setUser(data);
      return data;
    } catch (err) {
      setUser(null);
      throw err;
    }
  };

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // fetchAndSetOfficer will be handled by the onAuthStateChange listener
      // but we await it here so we can throw the "Not authorized" error directly to the login form
      if (data?.user) {
        await fetchAndSetOfficer(data.user.id);
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: Boolean(user), isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
