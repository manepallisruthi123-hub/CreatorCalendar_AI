import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeProfile, setActiveProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = localStorage.getItem('creator_calendar_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.auth.me();
      setUser(data.user);
      await loadProfiles();
    } catch (err) {
      console.warn('Auth check failed, clearing token:', err.message);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadProfiles() {
    try {
      const res = await api.profiles.list();
      setProfiles(res.profiles || []);
      if (res.profiles && res.profiles.length > 0) {
        // Restore saved profile selection if valid, otherwise pick first
        const savedId = localStorage.getItem('creator_calendar_active_profile');
        const matched = res.profiles.find(p => p.id === savedId);
        setActiveProfile(matched || res.profiles[0]);
      } else {
        setActiveProfile(null);
      }
    } catch (err) {
      console.error('Failed to load profiles:', err);
    }
  }

  function selectProfile(profile) {
    setActiveProfile(profile);
    if (profile?.id) {
      localStorage.setItem('creator_calendar_active_profile', profile.id);
    } else {
      localStorage.removeItem('creator_calendar_active_profile');
    }
  }

  async function login(email, password) {
    const data = await api.auth.login({ email, password });
    setToken(data.token);
    setUser(data.user);
    await loadProfiles();
    return data;
  }

  async function register(name, email, password) {
    const data = await api.auth.register({ name, email, password });
    setToken(data.token);
    setUser(data.user);
    await loadProfiles();
    return data;
  }

  async function logout() {
    try {
      await api.auth.logout();
    } catch (e) {
      // Ignore network errors on logout
    }
    setToken(null);
    setUser(null);
    setActiveProfile(null);
    setProfiles([]);
    localStorage.removeItem('creator_calendar_active_profile');
  }

  const value = {
    user,
    loading,
    activeProfile,
    profiles,
    selectProfile,
    refreshProfiles: loadProfiles,
    login,
    register,
    logout,
    isAuthenticated: Boolean(user),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
