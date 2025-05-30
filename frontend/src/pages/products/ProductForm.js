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
  Snackbar
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    quantityInStock: '',
    lowStockThreshold: '',
    barcode: '',
    location: ''
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Fetch product data from localStorage if in edit mode
  useEffect(() => {
    const fetchProduct = async () => {
      if (!isEditMode) return;
      
      try {
        setLoading(true);
        
        // Get products from localStorage
        const storedProducts = JSON.parse(localStorage.getItem('products') || '[]');
        
        const product = storedProducts.find(p => p.id === id);
        
        if (product) {
          setFormData({
            name: product.name,
            description: product.description || '',
            category: product.category,
            price: product.price.toString(),
            quantityInStock: product.quantityInStock.toString(),
            lowStockThreshold: product.lowStockThreshold.toString(),
            barcode: product.barcode || '',
            location: product.location || ''
          });
        } else {
          setError('Product not found');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Failed to load product data');
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id, isEditMode]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Validate form data
      if (!formData.name || !formData.category || !formData.price || !formData.quantityInStock || !formData.lowStockThreshold) {
        setError('Please fill in all required fields');
        setSubmitting(false);
        return;
      }
      
      // Convert numeric values
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        quantityInStock: parseInt(formData.quantityInStock, 10),
        lowStockThreshold: parseInt(formData.lowStockThreshold, 10)
      };
      
      // Generate a unique ID for new products
      if (!isEditMode) {
        productData.id = 'product-' + Date.now();
      }
      
      // Get existing products from localStorage
      const existingProducts = JSON.parse(localStorage.getItem('products') || '[]');
      
      // Update or add the product
      if (isEditMode) {
        // Find and update the existing product
        const updatedProducts = existingProducts.map(product => 
          product.id === id ? { ...product, ...productData } : product
        );
        localStorage.setItem('products', JSON.stringify(updatedProducts));
      } else {
        // Add the new product
        existingProducts.push(productData);
        localStorage.setItem('products', JSON.stringify(existingProducts));
      }
      
      console.log('Product saved to localStorage:', productData);
      
      setSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/products');
      }, 1500);
      
    } catch (error) {
      console.error('Error saving product:', error);
      setError('Failed to save product');
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
          {isEditMode ? 'Edit Product' : 'Add Product'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/products')}
        >
          Back to Products
        </Button>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Product Name"
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
                <MenuItem value="oil">Oil</MenuItem>
                <MenuItem value="filter">Filter</MenuItem>
                <MenuItem value="fluid">Fluid</MenuItem>
                <MenuItem value="part">Part</MenuItem>
                <MenuItem value="accessory">Accessory</MenuItem>
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
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                label="Price"
                name="price"
                value={formData.price}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                type="number"
                inputProps={{ min: 0 }}
                label="Quantity in Stock"
                name="quantityInStock"
                value={formData.quantityInStock}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                type="number"
                inputProps={{ min: 1 }}
                label="Low Stock Threshold"
                name="lowStockThreshold"
                value={formData.lowStockThreshold}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Barcode"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Storage Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
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
                {submitting ? 'Saving...' : 'Save Product'}
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
          Product saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductForm;
