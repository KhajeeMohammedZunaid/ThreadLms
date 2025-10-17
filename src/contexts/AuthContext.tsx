/**
 * Authentication Context
 * Global authentication state management
 */

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import authService, { User } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isFaculty: boolean;
  isStudent: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Initialize user from localStorage IMMEDIATELY (synchronous)
  const [user, setUser] = useState<User | null>(() => {
    const token = authService.getToken();
    const storedUser = authService.getUser();
    
    // Return stored user immediately if both token and user exist
    return (token && storedUser) ? storedUser : null;
  });
  const [loading, setLoading] = useState<boolean>(true); // Changed: Start as TRUE to prevent premature API calls
  const [initialized, setInitialized] = useState<boolean>(false);

  // Initialize auth state on mount - ONLY ONCE
  useEffect(() => {
    if (initialized) return;

    const initAuth = async () => {
      const token = authService.getToken();
      const storedUser = authService.getUser();
      
      if (token && storedUser) {
        // User already set in useState initializer, just mark as initialized
        setUser(storedUser);
        setLoading(false);
        setInitialized(true);
        
        // Only verify token if we're on a page refresh (not after fresh login)
        // This prevents the "no token" warning during login flow
        // We use a small delay to ensure token is fully stored
        setTimeout(() => {
          authService.getCurrentUser()
            .then(currentUser => {
              setUser(currentUser);
            })
            .catch(err => {
              console.error('❌ Token verification failed:', err.message);
              // Only clear and redirect if the error is 401 (invalid token)
              if (err.message.includes('401') || err.message.includes('Unauthorized')) {
                authService.logout();
                setUser(null);
                window.location.href = '/login';
              }
            });
        }, 100); // Small delay to ensure localStorage is fully updated
      } else {
        // No token or user, user is not authenticated
        setUser(null);
        setLoading(false);
        setInitialized(true);
      }
    };

    initAuth();
  }, [initialized]);

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      setUser(response.data.user);
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (data: any) => {
    setLoading(true);
    try {
      const response = await authService.register(data);
      // The response structure is { status, token, data: { user } }
      // authService.register already handles token and user storage
      setUser(response.data.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    authService.logout();
  };

  // Update user in state
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    authService.setUser(updatedUser);
  };

  // Refresh user data from backend
  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('❌ Error refreshing user:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    isFaculty: user?.role === 'faculty',
    isStudent: user?.role === 'student',
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
