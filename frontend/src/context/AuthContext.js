import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Initialize user from localStorage if available
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!storedToken) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return false;
      }
      
      // Check if token is expired
      const decodedToken = jwt_decode(storedToken);
      const currentTime = Date.now() / 1000;
      
      if (decodedToken.exp < currentTime) {
        // Token is expired
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
        setLoading(false);
        return false;
      }
      
      // If we have stored user data, use it instead of making an API call
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        setLoading(false);
        return true;
      }
      
      // If no stored user data, get it from API
      try {
        const response = await axios.get('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        });
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(response.data));
        setUser(response.data);
        setToken(storedToken);
        setLoading(false);
        return true;
      } catch (error) {
        // If API call fails but we have a token, create a minimal user object
        // This allows the app to function even if the /me endpoint fails
        if (storedToken) {
          const fallbackUser = {
            id: decodedToken.id || 'unknown',
            name: decodedToken.name || 'User',
            email: decodedToken.email || 'user@example.com',
            role: decodedToken.role || 'user'
          };
          localStorage.setItem('user', JSON.stringify(fallbackUser));
          setUser(fallbackUser);
          setToken(storedToken);
          setLoading(false);
          return true;
        }
        throw error;
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
      setLoading(false);
      return false;
    }
  }, []);

  // Login user
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/auth/login', credentials);
      const { token, user } = response.data;
      
      // Store both token and user in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setToken(token);
      setUser(user);
      setLoading(false);
      return user;
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      setLoading(false);
      throw error;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  // Update user profile
  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put('/api/auth/profile', userData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setUser(response.data.user);
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Profile update failed:', error);
      setError(error.response?.data?.message || 'Profile update failed. Please try again.');
      setLoading(false);
      return false;
    }
  };

  // Check if user has required role
  const hasRole = (requiredRoles) => {
    if (!user) return false;
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    
    return requiredRoles.includes(user.role);
  };

  // Check authentication status on mount
  useEffect(() => {
    // Only check auth if we have a token but no user
    if (token && !user) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    checkAuth,
    updateProfile,
    hasRole,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
