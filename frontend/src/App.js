import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import Subscribe from './components/Subscribe';
import BillingHistory from './components/BillingHistory';
import PaymentMethods from './components/PaymentMethods';
import Profile from './components/Profile';
import LandingPage from './components/LandingPage';
import './App.css';

const API_URL = 'https://subscription-management-task-1.onrender.com';

// Configure axios to include token in requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedCustomerId = localStorage.getItem('stripeCustomerId');
    
    // Try to fetch user using token first (new method)
    if (token) {
      fetchUserByToken();
    } 
    // Fallback to old method for backward compatibility
    else if (storedCustomerId) {
      fetchUser(storedCustomerId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserByToken = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      setUser(response.data.user);
      // Store customerId for backward compatibility
      if (response.data.user.stripeCustomerId) {
        localStorage.setItem('stripeCustomerId', response.data.user.stripeCustomerId);
      }
    } catch (error) {
      console.error('Error fetching user by token:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('stripeCustomerId');
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async (customerId) => {
    try {
      const response = await axios.get(`${API_URL}/customers/${customerId}`);
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('stripeCustomerId');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (emailOrUsername, password) => {
    try {
      setLoading(true);
      console.log('Attempting login with:', { emailOrUsername });
      const response = await axios.post(`${API_URL}/auth/login`, { emailOrUsername, password });
      console.log('Login response:', response.data);
      const { token, user: newUser } = response.data;
      
      if (!token || !newUser) {
        throw new Error('Invalid response from server');
      }
      
      setUser(newUser);
      localStorage.setItem('authToken', token);
      localStorage.setItem('stripeCustomerId', newUser.stripeCustomerId);
      console.log('Login successful, navigating to dashboard');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error logging in:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || error.message || 'Failed to login';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (username, email, password) => {
    try {
      setLoading(true);
      console.log('Attempting signup with:', { username, email });
      const response = await axios.post(`${API_URL}/auth/signup`, { username, email, password });
      console.log('Signup response:', response.data);
      const { token, user: newUser } = response.data;
      
      if (!token || !newUser) {
        throw new Error('Invalid response from server');
      }
      
      setUser(newUser);
      localStorage.setItem('authToken', token);
      localStorage.setItem('stripeCustomerId', newUser.stripeCustomerId);
      console.log('Signup successful, navigating to dashboard');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error signing up:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || error.message || 'Failed to create account';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('stripeCustomerId');
    navigate('/');
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onLogin={handleLogin} onSignup={handleSignup} />;
  }

  return (
    <div className="App">
      <nav className="navbar">
        <div className="container">
          <div className="nav-content">
            <NavLink to="/dashboard" className="nav-title">Subscription Management</NavLink>
            <div className="nav-links">
              <NavLink to="/dashboard" end>Dashboard</NavLink>
              <NavLink to="/subscribe">Subscribe</NavLink>
              <NavLink to="/billing">Billing History</NavLink>
              <NavLink to="/payment-methods">Payment Methods</NavLink>
              <NavLink to="/profile">Profile</NavLink>
            </div>
            <div className="nav-actions">
              <motion.button 
                onClick={handleLogout} 
                className="btn btn-secondary nav-logout"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Logout
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/subscribe" element={<Subscribe user={user} />} />
            <Route path="/billing" element={<BillingHistory user={user} />} />
            <Route path="/payment-methods" element={<PaymentMethods user={user} />} />
            <Route path="/profile" element={<Profile user={user} onUpdate={handleProfileUpdate} />} />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;

