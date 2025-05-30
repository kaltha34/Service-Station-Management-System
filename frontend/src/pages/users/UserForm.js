import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  TextField, 
  MenuItem, 
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  FormControlLabel,
  Switch
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../../context/AuthContext';

const UserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasRole } = useAuth();
  const isEditMode = Boolean(id);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff',
    active: true
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Fetch user data if in edit mode
  useEffect(() => {
    const fetchUser = async () => {
      if (!isEditMode) return;
      
      try {
        setLoading(true);
        
        // In a real application, this would be an API call
        // For now, we'll use mock data
        const mockUsers = [
          { id: '1', name: 'John Doe', email: 'john.doe@example.com', role: 'admin', active: true },
          { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'staff', active: true },
          { id: '3', name: 'Bob Johnson', email: 'bob.johnson@example.com', role: 'inventory_manager', active: true },
          { id: '4', name: 'Alice Williams', email: 'alice.williams@example.com', role: 'cashier', active: true },
          { id: '5', name: 'Charlie Brown', email: 'charlie.brown@example.com', role: 'staff', active: false }
        ];
        
        const user = mockUsers.find(u => u.id === id);
        
        if (user) {
          setFormData({
            name: user.name,
            email: user.email,
            password: '',
            confirmPassword: '',
            role: user.role,
            active: user.active
          });
        } else {
          setError('User not found');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('Failed to load user data');
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [id, isEditMode]);
  
  // Check if user has permission to access this page
  useEffect(() => {
    if (!hasRole(['admin'])) {
      navigate('/');
    }
  }, [hasRole, navigate]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    
    if (name === 'active') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Validate form data
      if (!formData.name || !formData.email || !formData.role) {
        setError('Please fill in all required fields');
        setSubmitting(false);
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        setSubmitting(false);
        return;
      }
      
      // Validate password for new users
      if (!isEditMode) {
        if (!formData.password) {
          setError('Password is required for new users');
          setSubmitting(false);
          return;
        }
        
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          setSubmitting(false);
          return;
        }
        
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setSubmitting(false);
          return;
        }
      } else if (formData.password && formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setSubmitting(false);
        return;
      }
      
      // In a real application, this would be an API call
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('User saved:', formData);
      
      setSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/users');
      }, 1500);
      
    } catch (error) {
      console.error('Error saving user:', error);
      setError('Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {isEditMode ? 'Edit User' : 'Add User'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/users')}
        >
          Back to Users
        </Button>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={isEditMode ? 'New Password (leave blank to keep current)' : 'Password'}
                name="password"
                type="password"
                required={!isEditMode}
                value={formData.password}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                required={!isEditMode || formData.password.length > 0}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                required
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <MenuItem value="admin">Administrator</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
                <MenuItem value="inventory_manager">Inventory Manager</MenuItem>
                <MenuItem value="cashier">Cashier</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={handleChange}
                    name="active"
                    color="primary"
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SaveIcon />}
                disabled={submitting}
                sx={{ mt: 2 }}
              >
                {submitting ? 'Saving...' : 'Save User'}
                {submitting && <CircularProgress size={24} sx={{ ml: 1 }} />}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          User saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserForm;
