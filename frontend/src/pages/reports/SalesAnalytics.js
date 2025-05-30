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
  Tabs,
  Tab
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import DateRangeIcon from '@mui/icons-material/DateRange';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../../context/AuthContext';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip as ChartTooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  ChartTooltip, 
  Legend
);

const SalesAnalytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const printRef = useRef();
  
  // State for analytics data
  const [analyticsData, setAnalyticsData] = useState({
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    growthRate: 0,
    topProducts: [],
    topServices: [],
    dailyRevenueArray: [],
    categorySales: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filters and tabs
  const [filters, setFilters] = useState({
    period: 'month',
    startDate: '',
    endDate: ''
  });
  const [tabValue, setTabValue] = useState(0);
  
  // Set default date range based on period
  useEffect(() => {
    const now = new Date();
    let startDate = new Date(now);
    
    if (filters.period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (filters.period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (filters.period === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      // Default to 30 days
      startDate.setDate(now.getDate() - 30);
    }
    
    setFilters({
      ...filters,
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    });
  }, [filters.period]);
  
  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!filters.startDate || !filters.endDate) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Build query parameters
        const queryParams = new URLSearchParams();
        if (filters.period !== 'custom') queryParams.append('period', filters.period);
        queryParams.append('startDate', filters.startDate);
        queryParams.append('endDate', filters.endDate);
        
        // Fetch data from API
        const response = await fetch(`/api/reports/analytics?${queryParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch sales analytics data');
        }
        
        const data = await response.json();
        
        // Validate the data to ensure all required properties exist
        const validatedData = {
          totalSales: data.totalSales || 0,
          totalRevenue: data.totalRevenue || 0,
          averageOrderValue: data.averageOrderValue || 0,
          growthRate: data.growthRate || 0,
          topProducts: Array.isArray(data.topProducts) ? data.topProducts : [],
          topServices: Array.isArray(data.topServices) ? data.topServices : [],
          dailyRevenueArray: Array.isArray(data.dailyRevenueArray) ? data.dailyRevenueArray : [],
          categorySales: data.categorySales || {}
        };
        
        // Format daily revenue as array for charts if not already formatted
        let dailyRevenueArray = validatedData.dailyRevenueArray;
        if (dailyRevenueArray.length === 0 && data.dailyRevenue) {
          dailyRevenueArray = Object.entries(data.dailyRevenue).map(([date, amount]) => ({
            date,
            amount
          }));
          
          // Sort by date
          dailyRevenueArray.sort((a, b) => new Date(a.date) - new Date(b.date));
          validatedData.dailyRevenueArray = dailyRevenueArray;
        }
        
        // Calculate growth metrics if not provided by the API
        if (validatedData.growthRate === 0 && dailyRevenueArray.length > 0) {
          const totalDays = dailyRevenueArray.length;
          const firstHalf = dailyRevenueArray.slice(0, Math.floor(totalDays / 2));
          const secondHalf = dailyRevenueArray.slice(Math.floor(totalDays / 2));
          
          const firstHalfTotal = firstHalf.reduce((sum, day) => sum + (day.amount || 0), 0);
          const secondHalfTotal = secondHalf.reduce((sum, day) => sum + (day.amount || 0), 0);
          
          if (firstHalfTotal > 0) {
            validatedData.growthRate = ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100;
          } else {
            validatedData.growthRate = secondHalfTotal > 0 ? 100 : 0;
          }
        }
        
        // Ensure these objects exist even if the API doesn't provide them
        validatedData.paymentMethods = data.paymentMethods || { cash: 0, card: 0, online: 0, other: 0 };
        validatedData.categoryBreakdown = data.categoryBreakdown || {
          services: {},
          products: {}
        };
        
        // Set the analytics data with validated data
        setAnalyticsData(validatedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setError('Failed to load analytics data: ' + error.message);
        
        // Create default data structure for error cases
        const defaultData = {
          totalSales: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          growthRate: 0,
          topProducts: [],
          topServices: [],
          dailyRevenueArray: [],
          categorySales: {},
          paymentMethods: { cash: 0, card: 0, online: 0, other: 0 },
          categoryBreakdown: {
            services: {},
            products: {}
          }
        };
        
        setAnalyticsData(defaultData);
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [filters.startDate, filters.endDate]);
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle print functionality
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Sales-Analytics-${new Date().toISOString().split('T')[0]}`,
  });
  
  // Handle PDF download
  const handleDownloadPDF = () => {
    // Redirect to the API endpoint for PDF download
    const queryParams = new URLSearchParams();
    if (filters.period !== 'custom') queryParams.append('period', filters.period);
    queryParams.append('startDate', filters.startDate);
    queryParams.append('endDate', filters.endDate);
    queryParams.append('format', 'pdf');
    
    const token = localStorage.getItem('token');
    
    // Create a form to submit as POST (to include the token in a secure way)
    const form = document.createElement('form');
    form.method = 'GET';
    form.action = `/api/reports/analytics?${queryParams.toString()}`;
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
  
  // Prepare chart data
  const getDailyRevenueChartData = () => {
    if (!analyticsData) return null;
    
    return {
      labels: analyticsData.dailyRevenueArray.map(day => {
        const date = new Date(day.date);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Daily Revenue',
          data: analyticsData.dailyRevenueArray.map(day => day.amount),
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  };
  
  const getTopServicesChartData = () => {
    if (!analyticsData) return null;
    
    return {
      labels: analyticsData.topServices.map(service => service.name),
      datasets: [
        {
          label: 'Revenue',
          data: analyticsData.topServices.map(service => service.total),
          backgroundColor: [
            '#1976d2',
            '#2196f3',
            '#64b5f6',
            '#90caf9',
            '#bbdefb',
          ],
          borderWidth: 1
        }
      ]
    };
  };
  
  const getPaymentMethodsChartData = () => {
    if (!analyticsData) return null;
    
    return {
      labels: Object.keys(analyticsData.paymentMethods).map(
        method => method.charAt(0).toUpperCase() + method.slice(1)
      ),
      datasets: [
        {
          data: Object.values(analyticsData.paymentMethods),
          backgroundColor: [
            '#4caf50',
            '#ff9800',
            '#2196f3',
            '#9e9e9e',
          ],
          borderWidth: 1
        }
      ]
    };
  };
  
  const getCategoryBreakdownChartData = () => {
    if (!analyticsData) return null;
    
    // Combine services and products categories
    const serviceCategories = Object.entries(analyticsData.categoryBreakdown.services).map(
      ([category, amount]) => ({
        category: `Service: ${category.charAt(0).toUpperCase() + category.slice(1)}`,
        amount
      })
    );
    
    const productCategories = Object.entries(analyticsData.categoryBreakdown.products).map(
      ([category, amount]) => ({
        category: `Product: ${category.charAt(0).toUpperCase() + category.slice(1)}`,
        amount
      })
    );
    
    const combinedCategories = [...serviceCategories, ...productCategories];
    
    // Sort by amount descending
    combinedCategories.sort((a, b) => b.amount - a.amount);
    
    return {
      labels: combinedCategories.map(item => item.category),
      datasets: [
        {
          data: combinedCategories.map(item => item.amount),
          backgroundColor: [
            '#1976d2',
            '#2196f3',
            '#64b5f6',
            '#90caf9',
            '#bbdefb',
            '#4caf50',
            '#66bb6a',
            '#81c784',
            '#a5d6a7',
            '#c8e6c9',
          ],
          borderWidth: 1
        }
      ]
    };
  };
  
  const getMonthlyTrendsChartData = () => {
    if (!analyticsData || !analyticsData.monthlyTrends) return null;
    
    return {
      labels: Object.keys(analyticsData.monthlyTrends).map(month => {
        const [year, monthNum] = month.split('-');
        return new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      }),
      datasets: [
        {
          label: 'Monthly Revenue',
          data: Object.values(analyticsData.monthlyTrends),
          backgroundColor: '#1976d2',
          borderColor: '#1976d2',
          borderWidth: 1
        }
      ]
    };
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `$${context.raw.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value;
          }
        }
      }
    }
  };
  
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            if (context.dataset.label === 'Revenue') {
              return `$${context.raw.toFixed(2)}`;
            }
            return context.raw;
          }
        }
      }
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Add a safety check for null analyticsData
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
          Sales Analytics
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
          <Grid item xs={12} sm={3} md={2}>
            <TextField
              select
              fullWidth
              label="Period"
              name="period"
              value={filters.period}
              onChange={handleFilterChange}
            >
              <MenuItem value="week">Last Week</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
              <MenuItem value="year">Last Year</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
              disabled={filters.period !== 'custom'}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
              disabled={filters.period !== 'custom'}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleDownloadPDF}
              startIcon={<DownloadIcon />}
            >
              Download Report
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
              Sales Analytics Report
            </Typography>
            <Typography variant="subtitle1">
              Period: {analyticsData && analyticsData.period ? 
                `${new Date(analyticsData.period.start).toLocaleDateString()} - ${new Date(analyticsData.period.end).toLocaleDateString()}` : 
                'Not specified'}
            </Typography>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {/* Summary cards */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4">
                    ${analyticsData && analyticsData.totalRevenue ? analyticsData.totalRevenue.toFixed(2) : '0.00'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {analyticsData && analyticsData.growthRate >= 0 ? (
                      <>
                        <TrendingUpIcon color="success" fontSize="small" />
                        <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                          +{analyticsData && analyticsData.growthRate ? analyticsData.growthRate.toFixed(1) : '0'}% growth
                        </Typography>
                      </>
                    ) : (
                      <>
                        <TrendingDownIcon color="error" fontSize="small" />
                        <Typography variant="body2" color="error.main" sx={{ ml: 0.5 }}>
                          {analyticsData && analyticsData.growthRate ? analyticsData.growthRate.toFixed(1) : '0'}% decline
                        </Typography>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total Sales
                  </Typography>
                  <Typography variant="h4">
                    {analyticsData && analyticsData.totalSales ? analyticsData.totalSales : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg. sale: ${analyticsData && analyticsData.averageSale ? analyticsData.averageSale.toFixed(2) : '0.00'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Services Revenue
                  </Typography>
                  <Typography variant="h4">
                    ${analyticsData && analyticsData.categoryBreakdown && analyticsData.categoryBreakdown.services ? 
                      Object.values(analyticsData.categoryBreakdown.services).reduce((sum, val) => sum + val, 0).toFixed(2) : '0.00'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {analyticsData && analyticsData.topServices ? 
                      analyticsData.topServices.reduce((sum, service) => sum + service.count, 0) : 0} services performed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Products Revenue
                  </Typography>
                  <Typography variant="h4">
                    ${analyticsData && analyticsData.categoryBreakdown && analyticsData.categoryBreakdown.products ? 
                      Object.values(analyticsData.categoryBreakdown.products).reduce((sum, val) => sum + val, 0).toFixed(2) : '0.00'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {analyticsData && analyticsData.topProducts ? 
                      analyticsData.topProducts.reduce((sum, product) => sum + product.quantity, 0) : 0} items sold
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Tabs for different analytics views */}
        <Paper elevation={3} sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Revenue Trends" />
            <Tab label="Top Performers" />
            <Tab label="Category Breakdown" />
          </Tabs>
          
          {/* Revenue Trends Tab */}
          {tabValue === 0 && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Daily Revenue Trend
              </Typography>
              <Box sx={{ height: 400, mb: 4 }}>
                {getDailyRevenueChartData() && (
                  <Line data={getDailyRevenueChartData()} options={chartOptions} />
                )}
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Monthly Revenue Trend
              </Typography>
              <Box sx={{ height: 400 }}>
                {getMonthlyTrendsChartData() && (
                  <Bar data={getMonthlyTrendsChartData()} options={chartOptions} />
                )}
              </Box>
            </Box>
          )}
          
          {/* Top Performers Tab */}
          {tabValue === 1 && (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Top Services by Revenue
                  </Typography>
                  <Box sx={{ height: 400, mb: 4 }}>
                    {getTopServicesChartData() && (
                      <Bar data={getTopServicesChartData()} options={chartOptions} />
                    )}
                  </Box>
                  
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Service</TableCell>
                          <TableCell align="right">Count</TableCell>
                          <TableCell align="right">Revenue</TableCell>
                          <TableCell align="right">Avg. Price</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analyticsData.topServices.map((service, index) => (
                          <TableRow key={index}>
                            <TableCell>{service.name}</TableCell>
                            <TableCell align="right">{service.count}</TableCell>
                            <TableCell align="right">${service.total.toFixed(2)}</TableCell>
                            <TableCell align="right">
                              ${(service.total / service.count).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Top Products by Revenue
                  </Typography>
                  <Box sx={{ height: 400, mb: 4 }}>
                    {analyticsData.topProducts && (
                      <Bar 
                        data={{
                          labels: analyticsData.topProducts.map(product => product.name),
                          datasets: [
                            {
                              label: 'Revenue',
                              data: analyticsData.topProducts.map(product => product.total),
                              backgroundColor: '#4caf50',
                              borderColor: '#4caf50',
                              borderWidth: 1
                            }
                          ]
                        }} 
                        options={chartOptions} 
                      />
                    )}
                  </Box>
                  
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Revenue</TableCell>
                          <TableCell align="right">Avg. Price</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analyticsData.topProducts.map((product, index) => (
                          <TableRow key={index}>
                            <TableCell>{product.name}</TableCell>
                            <TableCell align="right">{product.quantity}</TableCell>
                            <TableCell align="right">${product.total.toFixed(2)}</TableCell>
                            <TableCell align="right">
                              ${(product.total / product.quantity).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {/* Category Breakdown Tab */}
          {tabValue === 2 && (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Revenue by Category
                  </Typography>
                  <Box sx={{ height: 400, mb: 4 }}>
                    {getCategoryBreakdownChartData() && (
                      <Pie data={getCategoryBreakdownChartData()} options={pieChartOptions} />
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Payment Methods
                  </Typography>
                  <Box sx={{ height: 400, mb: 4 }}>
                    {getPaymentMethodsChartData() && (
                      <Pie data={getPaymentMethodsChartData()} options={pieChartOptions} />
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Service Categories
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Revenue</TableCell>
                          <TableCell align="right">% of Services</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(analyticsData.categoryBreakdown.services).map(([category, amount], index) => {
                          const totalServices = Object.values(analyticsData.categoryBreakdown.services).reduce((sum, val) => sum + val, 0);
                          const percentage = (amount / totalServices) * 100;
                          
                          return (
                            <TableRow key={index}>
                              <TableCell>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                              </TableCell>
                              <TableCell align="right">${amount.toFixed(2)}</TableCell>
                              <TableCell align="right">{percentage.toFixed(1)}%</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Product Categories
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Revenue</TableCell>
                          <TableCell align="right">% of Products</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(analyticsData.categoryBreakdown.products).map(([category, amount], index) => {
                          const totalProducts = Object.values(analyticsData.categoryBreakdown.products).reduce((sum, val) => sum + val, 0);
                          const percentage = (amount / totalProducts) * 100;
                          
                          return (
                            <TableRow key={index}>
                              <TableCell>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                              </TableCell>
                              <TableCell align="right">${amount.toFixed(2)}</TableCell>
                              <TableCell align="right">{percentage.toFixed(1)}%</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Box>
          )}
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

export default SalesAnalytics;
