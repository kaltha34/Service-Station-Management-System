import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from './context/AuthContext';

// Layout components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Auth pages
import Login from './pages/auth/Login';

// Dashboard pages
import Dashboard from './pages/dashboard/Dashboard';

// Service pages
import ServiceList from './pages/services/ServiceList';
import ServiceForm from './pages/services/ServiceForm';

// Product pages
import ProductList from './pages/products/ProductList';
import ProductForm from './pages/products/ProductForm';

// Billing pages
import NewBill from './pages/billing/NewBill';
import BillList from './pages/billing/BillList';
import BillDetails from './pages/billing/BillDetails';

// Error pages
import NotFound from './pages/errors/NotFound';

function App() {
  const theme = useTheme();
  const { isAuthenticated, loading, checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: theme.palette.background.default
        }}
      >
        Loading...
      </Box>
    );
  }

  return (
    <>
      <CssBaseline />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          
          {/* Services routes */}
          <Route path="/services" element={<ServiceList />} />
          <Route path="/services/new" element={<ServiceForm />} />
          <Route path="/services/edit/:id" element={<ServiceForm />} />
          
          {/* Products routes */}
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/new" element={<ProductForm />} />
          <Route path="/products/edit/:id" element={<ProductForm />} />
          
          {/* Billing routes */}
          <Route path="/billing/new" element={<NewBill />} />
          <Route path="/billing" element={<BillList />} />
          <Route path="/billing/:id" element={<BillDetails />} />
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
