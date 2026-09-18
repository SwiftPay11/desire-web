'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import authService from '@/services/auth.service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    authService.getStoredUser(),
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!authService.isAuthenticated()) {
          setLoading(false);
          return;
        }

        const profile =
          await authService.getProfile();

        setUser(profile);
      } catch (error) {
        authService.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    const data =
      await authService.login(credentials);

    const profile =
      data.user ??
      (await authService.getProfile());

    setUser(profile);

    return profile;
  };

  const register = async (payload) => {
    const data =
      await authService.register(payload);

    if (data.user) {
      setUser(data.user);
    }

    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    const profile =
      await authService.getProfile();

    setUser(profile);

    return profile;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,

        login,
        register,
        logout,

        refreshUser,

        isAuthenticated:
          !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider.',
    );
  }

  return context;
}