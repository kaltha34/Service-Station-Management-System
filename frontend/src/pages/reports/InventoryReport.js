import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Button, 
  Divider, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  TextField,
  MenuItem,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../../context/AuthContext';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, ChartTooltip, Legend);

const InventoryReport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const printRef = useRef();
  
  // State for report data
  const [reportData, setReportData] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    filteredCount: 0,
    filteredValue: 0,
    categories: {},
    products: []
  });
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filters
  const [filters, setFilters] = useState({
    category: '',
    lowStock: '',
    sort: 'name:asc'
  });
  
  // Fetch report data
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build query parameters
        const queryParams = new URLSearchParams();
        if (filters.category) queryParams.append('category', filters.category);
        if (filters.lowStock === 'low') queryParams.append('lowStock', 'true');
        if (filters.sort) queryParams.append('sort', filters.sort);
        
        // Fetch data from API
        const response = await fetch(`/api/reports/inventory?${queryParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch inventory report data');
        }
        
        const data = await response.json();
        
        // Ensure data has all required properties
        const validatedData = {
          totalProducts: data.totalProducts || 0,
          totalValue: data.totalValue || 0,
          lowStockCount: data.lowStockCount || 0,
          outOfStockCount: data.outOfStockCount || 0,
          filteredCount: data.filteredCount || 0,
          filteredValue: data.filteredValue || 0,
          categories: data.categories || {},
          products: Array.isArray(data.products) ? data.products : []
        };
        
        setReportData(validatedData);
        
        // Apply client-side filtering for out of stock and healthy items
        // since the backend only has a lowStock filter
        let filteredProducts = [...validatedData.products];
        
        if (filters.lowStock === 'out') {
          filteredProducts = filteredProducts.filter(p => p.quantityInStock === 0);
        } else if (filters.lowStock === 'healthy') {
          filteredProducts = filteredProducts.filter(p => p.quantityInStock > (p.lowStockThreshold || 5));
        }
        
        // Set the filtered products state
        setFilteredProducts(filteredProducts);
      } catch (error) {
        console.error('Error fetching report data:', error);
        setError('Failed to load report data: ' + error.message);
        
        // Create empty default data instead of mock data
        const defaultData = {
          totalProducts: 0,
          totalValue: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
          filteredCount: 0,
          filteredValue: 0,
          categories: {},
          products: []
        };
        
        setReportData(defaultData);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, []);
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  // Handle print functionality
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Inventory-Report-${new Date().toISOString().split('T')[0]}`,
  });
  
  // Handle PDF download
  const handleDownloadPDF = () => {
    // Redirect to the API endpoint for PDF download
    const queryParams = new URLSearchParams();
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.lowStock === 'low') queryParams.append('lowStock', 'true');
    if (filters.sort) queryParams.append('sort', filters.sort);
    queryParams.append('format', 'pdf');
    
    const token = localStorage.getItem('token');
    
    // Create a form to submit as POST (to include the token in a secure way)
    const form = document.createElement('form');
    form.method = 'GET';
    form.action = `/api/reports/inventory?${queryParams.toString()}`;
    form.target = '_blank';
    
    // Add authorization header through a hidden input
    const authInput = document.createElement('input');
    authInput.type = 'hidden';
    authInput.name = 'Authorization';
    authInput.value = `Bearer ${token}`;
    form.appendChild(authInput);
    
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };
  
  // Handle CSV download
  const handleDownloadCSV = () => {
    // Generate CSV from the current filtered data
    
    if (!reportData) return;
    
    // Create CSV content
    const headers = ['Product', 'Category', 'Price', 'Quantity', 'Threshold', 'Value', 'Status'];
    const rows = filteredProducts.map(product => {
      let status = 'OK';
      if (product.quantityInStock === 0) {
        status = 'Out of Stock';
      } else if (product.quantityInStock <= product.lowStockThreshold) {
        status = 'Low Stock';
      }
      
      return [
        product.name,
        product.category,
        product.price.toFixed(2),
        product.quantityInStock,
        product.lowStockThreshold,
        product.value.toFixed(2),
        status
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventory-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Prepare chart data
  const getCategoryChartData = () => {
    if (!reportData || !reportData.categories || !reportData.categories.length) return null;
    
    return {
      labels: reportData.categories.map(cat => cat.name.charAt(0).toUpperCase() + cat.name.slice(1)),
      datasets: [
        {
          data: reportData.categories.map(cat => cat.value),
          backgroundColor: [
            '#1976d2',
            '#2196f3',
            '#64b5f6',
            '#90caf9',
            '#bbdefb',
          ],
          borderWidth: 1,
        },
      ],
    };
  };
  
  const getStockStatusChartData = () => {
    if (!reportData) return null;
    
    const totalProducts = reportData.totalProducts || 0;
    const lowStockCount = reportData.lowStockCount || 0;
    const outOfStockCount = reportData.outOfStockCount || 0;
    const healthyCount = totalProducts - lowStockCount - outOfStockCount;
    
    return {
      labels: ['Healthy', 'Low Stock', 'Out of Stock'],
      datasets: [
        {
          data: [healthyCount, lowStockCount, outOfStockCount],
          backgroundColor: [
            '#4caf50',
            '#ff9800',
            '#f44336',
          ],
          borderWidth: 1,
        },
      ],
    };
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      }
    }
  };
  
  // Get stock status color and icon
  const getStockStatus = (product) => {
    if (product.quantityInStock === 0) {
      return {
        label: 'Out of Stock',
        color: 'error',
        icon: <ErrorIcon fontSize="small" />
      };
    } else if (product.quantityInStock <= product.lowStockThreshold) {
      return {
        label: 'Low Stock',
        color: 'warning',
        icon: <WarningIcon fontSize="small" />
      };
    } else {
      return {
        label: 'Healthy',
        color: 'success',
        icon: <CheckCircleIcon fontSize="small" />
      };
    }
  };
  
  // Calculate stock level percentage
  const getStockLevelPercentage = (product) => {
    if (product.lowStockThreshold === 0) return 100;
    const percentage = (product.quantityInStock / (product.lowStockThreshold * 2)) * 100;
    return Math.min(percentage, 100);
  };
  
  // Show loading state while data is being fetched
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Initialize default data if reportData is null
  const defaultData = {
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    filteredCount: 0,
    filteredValue: 0,
    categories: [],
    products: []
  };
  
  // Use reportData if available, otherwise use default data
  const data = reportData || defaultData;
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Inventory Report
        </Typography>
        <Box>
          <Tooltip title="Print Report">
            <IconButton onClick={handlePrint} sx={{ mr: 1 }}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download PDF">
            <IconButton onClick={handleDownloadPDF}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Filters */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              select
              fullWidth
              label="Category"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <MenuItem value="">All Categories</MenuItem>
              <MenuItem value="oil">Oil</MenuItem>
              <MenuItem value="filter">Filter</MenuItem>
              <MenuItem value="fluid">Fluid</MenuItem>
              <MenuItem value="part">Part</MenuItem>
              <MenuItem value="accessory">Accessory</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              select
              fullWidth
              label="Stock Status"
              name="lowStock"
              value={filters.lowStock}
              onChange={handleFilterChange}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="low">Low Stock</MenuItem>
              <MenuItem value="out">Out of Stock</MenuItem>
              <MenuItem value="healthy">Healthy</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              select
              fullWidth
              label="Sort By"
              name="sort"
              value={filters.sort}
              onChange={handleFilterChange}
            >
              <MenuItem value="name:asc">Name (A-Z)</MenuItem>
              <MenuItem value="name:desc">Name (Z-A)</MenuItem>
              <MenuItem value="stock:asc">Stock (Low to High)</MenuItem>
              <MenuItem value="stock:desc">Stock (High to Low)</MenuItem>
              <MenuItem value="value:asc">Value (Low to High)</MenuItem>
              <MenuItem value="value:desc">Value (High to Low)</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleDownloadCSV}
              startIcon={<DownloadIcon />}
            >
              Export to CSV
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Report content */}
      <Box ref={printRef} sx={{ p: 2 }}>
        {/* Report header */}
        <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Service Station
            </Typography>
            <Typography variant="h6" gutterBottom>
              Inventory Report
            </Typography>
            <Typography variant="subtitle1">
              Date: {new Date().toLocaleDateString()}
            </Typography>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {/* Summary cards */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total Products
                  </Typography>
                  <Typography variant="h4">
                    {reportData.totalProducts || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In {reportData.categories ? reportData.categories.length : 0} categories
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total Inventory Value
                  </Typography>
                  <Typography variant="h4">
                    ${reportData.totalValue ? reportData.totalValue.toFixed(2) : '0.00'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg. per product: ${reportData.totalValue && reportData.totalProducts ? 
                      (reportData.totalValue / reportData.totalProducts).toFixed(2) : '0.00'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Low Stock Items
                  </Typography>
                  <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
                    {reportData.lowStockCount || 0}
                    <WarningIcon color="warning" sx={{ ml: 1 }} />
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {reportData.outOfStockCount || 0} out of stock
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Filtered Results
                  </Typography>
                  <Typography variant="h4">
                    {reportData.filteredCount || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Value: ${reportData.filteredValue ? reportData.filteredValue.toFixed(2) : '0.00'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: 350 }}>
              <Typography variant="h6" gutterBottom>
                Inventory Value by Category
              </Typography>
              <Box sx={{ height: 280 }}>
                {getCategoryChartData() && <Pie data={getCategoryChartData()} options={chartOptions} />}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: 350 }}>
              <Typography variant="h6" gutterBottom>
                Stock Status Distribution
              </Typography>
              <Box sx={{ height: 280 }}>
                {getStockStatusChartData() && <Pie data={getStockStatusChartData()} options={chartOptions} />}
              </Box>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Products table */}
        <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Products
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Stock</TableCell>
                  <TableCell>Stock Level</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.products.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const stockPercentage = getStockLevelPercentage(product);
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>
                        {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                      </TableCell>
                      <TableCell align="right">${product.price.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        {product.quantityInStock} / {product.lowStockThreshold}
                      </TableCell>
                      <TableCell>
                        <LinearProgress 
                          variant="determinate" 
                          value={stockPercentage} 
                          color={stockStatus.color}
                          sx={{ height: 10, borderRadius: 5 }}
                        />
                      </TableCell>
                      <TableCell align="right">${product.value.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          icon={stockStatus.icon}
                          label={stockStatus.label}
                          color={stockStatus.color}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {reportData.products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No products found for the selected filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        
        {/* Categories summary */}
        <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Categories Summary
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Product Count</TableCell>
                  <TableCell align="right">Total Value</TableCell>
                  <TableCell align="right">Average Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.categories.map((category, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                    </TableCell>
                    <TableCell align="right">{category.count}</TableCell>
                    <TableCell align="right">${category.value.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      ${(category.value / category.count).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        
        {/* Report footer */}
        <Box sx={{ textAlign: 'center', mt: 3, mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Report generated on {new Date().toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Service Station Management System
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default InventoryReport;
