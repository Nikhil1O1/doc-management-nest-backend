import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'editor' | 'viewer';
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Check if we have user data in localStorage first
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setIsLoading(false);
        } catch (error) {
          console.error('Failed to parse stored user data:', error);
          fetchProfile();
        }
      } else {
        // Only fetch profile if we don't have stored user data
        fetchProfile();
      }
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/auth/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { user: userData, access_token } = response.data;
      
      // Add isActive property for compatibility with User interface
      const userWithActiveStatus = {
        ...userData,
        isActive: true
      };
      
      setUser(userWithActiveStatus);
      setToken(access_token);
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userWithActiveStatus));
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setIsLoading(false);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      await axios.post('/auth/register', userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 