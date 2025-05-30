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
  Switch,
  InputAdornment
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../../context/AuthContext';

const ServiceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasRole } = useAuth();
  const isEditMode = Boolean(id);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    duration: '',
    active: true
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Check if user has permission
  useEffect(() => {
    if (!hasRole(['admin', 'staff'])) {
      navigate('/');
    }
  }, [hasRole, navigate]);
  
  // Fetch service data from localStorage if in edit mode
  useEffect(() => {
    const fetchService = async () => {
      if (!isEditMode) return;
      
      try {
        setLoading(true);
        
        // Get services from localStorage
        const storedServices = JSON.parse(localStorage.getItem('services') || '[]');
        
        const service = storedServices.find(s => s.id === id);
        
        if (service) {
          setFormData({
            name: service.name,
            description: service.description,
            category: service.category,
            price: service.price.toString(),
            duration: service.duration.toString(),
            active: service.active
          });
        } else {
          setError('Service not found');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching service:', error);
        setError('Failed to load service data');
        setLoading(false);
      }
    };
    
    fetchService();
  }, [id, isEditMode]);
  
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
      if (!formData.name || !formData.category || !formData.price || !formData.duration) {
        setError('Please fill in all required fields');
        setSubmitting(false);
        return;
      }
      
      // Validate numeric values
      if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
        setError('Price must be a positive number');
        setSubmitting(false);
        return;
      }
      
      if (isNaN(parseInt(formData.duration)) || parseInt(formData.duration) <= 0) {
        setError('Duration must be a positive number');
        setSubmitting(false);
        return;
      }
      
      // Convert numeric values
      const serviceData = {
        ...formData,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration)
      };
      
      // Generate a unique ID for new services
      if (!isEditMode) {
        serviceData.id = 'service-' + Date.now();
      }
      
      // Get existing services from localStorage
      const existingServices = JSON.parse(localStorage.getItem('services') || '[]');
      
      // Update or add the service
      if (isEditMode) {
        // Find and update the existing service
        const updatedServices = existingServices.map(service => 
          service.id === id ? { ...service, ...serviceData } : service
        );
        localStorage.setItem('services', JSON.stringify(updatedServices));
      } else {
        // Add the new service
        existingServices.push(serviceData);
        localStorage.setItem('services', JSON.stringify(existingServices));
      }
      
      console.log('Service saved to localStorage:', serviceData);
      
      setSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/services');
      }, 1500);
      
    } catch (error) {
      console.error('Error saving service:', error);
      setError('Failed to save service');
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
          {isEditMode ? 'Edit Service' : 'Add Service'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/services')}
        >
          Back to Services
        </Button>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Service Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                required
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <MenuItem value="">Select a category</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="inspection">Inspection</MenuItem>
                <MenuItem value="wash">Wash & Detailing</MenuItem>
                <MenuItem value="repair">Repair</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                label="Price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                type="number"
                inputProps={{ min: 1 }}
                label="Duration (minutes)"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">min</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
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
                {submitting ? 'Saving...' : 'Save Service'}
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
          Service saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ServiceForm;
