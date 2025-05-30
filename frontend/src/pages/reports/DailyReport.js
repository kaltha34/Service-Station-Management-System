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
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../../context/AuthContext';

const DailyReport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const printRef = useRef();
  
  // State for report data
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State for filters
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    staffId: '',
    category: ''
  });
  
  // Fetch report data
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data for daily report
        const mockReportData = {
          date: filters.date,
          totalBills: 15,
          totalAmount: 5250.75,
          servicesTotal: 3450.50,
          productsTotal: 1800.25,
          services: [
            { name: 'Full Body Wash', count: 8, total: 1200.00, category: 'wash' },
            { name: 'Oil Change', count: 5, total: 1000.00, category: 'maintenance' },
            { name: 'Interior Vacuum', count: 6, total: 600.00, category: 'wash' },
            { name: 'Tire Rotation', count: 3, total: 360.00, category: 'maintenance' },
            { name: 'Engine Tune-up', count: 1, total: 350.00, category: 'repair' }
          ],
          products: [
            { name: 'Engine Oil 5W-30', quantity: 12, total: 960.00, category: 'oil' },
            { name: 'Oil Filter', quantity: 5, total: 200.00, category: 'filter' },
            { name: 'Brake Fluid', quantity: 3, total: 180.00, category: 'fluid' },
            { name: 'Coolant', quantity: 2, total: 140.00, category: 'fluid' },
            { name: 'Wiper Blades', quantity: 4, total: 180.00, category: 'accessory' }
          ],
          paymentMethods: {
            cash: 8,
            card: 5,
            online: 2,
            other: 0
          },
          paymentStatus: {
            completed: 14,
            pending: 1,
            failed: 0,
            refunded: 0
          }
        };
        
        // Apply filters
        if (filters.category) {
          mockReportData.services = mockReportData.services.filter(
            service => service.category === filters.category
          );
          
          mockReportData.products = mockReportData.products.filter(
            product => product.category === filters.category
          );
          
          // Recalculate totals
          mockReportData.servicesTotal = mockReportData.services.reduce(
            (sum, service) => sum + service.total, 0
          );
          
          mockReportData.productsTotal = mockReportData.products.reduce(
            (sum, product) => sum + product.total, 0
          );
          
          mockReportData.totalAmount = mockReportData.servicesTotal + mockReportData.productsTotal;
        }
        
        setReportData(mockReportData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching report data:', error);
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [filters]);
  
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
    documentTitle: `Daily-Report-${filters.date}`,
  });
  
  // Handle PDF download
  const handleDownloadPDF = () => {
    // In a real application, this would call the API to generate a PDF
    // For now, we'll just use the print functionality
    handlePrint();
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
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
          Daily Sales Report
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
              fullWidth
              label="Date"
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              select
              fullWidth
              label="Staff Member"
              name="staffId"
              value={filters.staffId}
              onChange={handleFilterChange}
            >
              <MenuItem value="">All Staff</MenuItem>
              <MenuItem value="1">Admin User</MenuItem>
              <MenuItem value="2">John Smith</MenuItem>
              <MenuItem value="3">Sarah Johnson</MenuItem>
            </TextField>
          </Grid>
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
              <MenuItem value="wash">Wash</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="repair">Repair</MenuItem>
              <MenuItem value="inspection">Inspection</MenuItem>
              <MenuItem value="oil">Oil</MenuItem>
              <MenuItem value="filter">Filter</MenuItem>
              <MenuItem value="fluid">Fluid</MenuItem>
              <MenuItem value="accessory">Accessory</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => handleDownloadPDF()}
            >
              Generate PDF
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
              Daily Sales Report
            </Typography>
            <Typography variant="subtitle1">
              Date: {formatDate(reportData.date)}
            </Typography>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {/* Summary cards */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total Sales
                  </Typography>
                  <Typography variant="h4">
                    ${reportData.totalAmount.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    From {reportData.totalBills} bills
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
                    ${reportData.servicesTotal.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {reportData.services.reduce((sum, service) => sum + service.count, 0)} services performed
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
                    ${reportData.productsTotal.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {reportData.products.reduce((sum, product) => sum + product.quantity, 0)} items sold
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Payment Methods
                  </Typography>
                  <Typography variant="body1">
                    Cash: {reportData.paymentMethods.cash}
                  </Typography>
                  <Typography variant="body1">
                    Card: {reportData.paymentMethods.card}
                  </Typography>
                  <Typography variant="body1">
                    Online: {reportData.paymentMethods.online}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Services */}
        <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Services
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Service</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Count</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.services.map((service, index) => (
                  <TableRow key={index}>
                    <TableCell>{service.name}</TableCell>
                    <TableCell>
                      {service.category.charAt(0).toUpperCase() + service.category.slice(1)}
                    </TableCell>
                    <TableCell align="right">{service.count}</TableCell>
                    <TableCell align="right">${service.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {reportData.services.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No services found for the selected filters
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell colSpan={2} />
                  <TableCell align="right">
                    <Typography variant="subtitle1">Total:</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle1">
                      ${reportData.servicesTotal.toFixed(2)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        
        {/* Products */}
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
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.products.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>
                      {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                    </TableCell>
                    <TableCell align="right">{product.quantity}</TableCell>
                    <TableCell align="right">${product.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {reportData.products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No products found for the selected filters
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell colSpan={2} />
                  <TableCell align="right">
                    <Typography variant="subtitle1">Total:</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle1">
                      ${reportData.productsTotal.toFixed(2)}
                    </Typography>
                  </TableCell>
                </TableRow>
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

export default DailyReport;
