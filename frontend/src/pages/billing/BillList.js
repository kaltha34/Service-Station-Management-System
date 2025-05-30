import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  TextField, 
  Button, 
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  MenuItem,
  InputAdornment,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useAuth } from '../../context/AuthContext';

const BillList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State for bills and pagination
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State for filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentStatus: '',
    paymentMethod: '',
    licensePlate: '',
    customerName: ''
  });
  
  // Load real bills from localStorage
  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoading(true);
        
        // Get bills from localStorage
        const storedBills = JSON.parse(localStorage.getItem('bills') || '[]');
        
        // Sort bills by date (newest first)
        storedBills.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date);
          const dateB = new Date(b.createdAt || b.date);
          return dateB - dateA;
        });
        
        setBills(storedBills);
        setLoading(false);
      } catch (error) {
        console.error('Error loading bills:', error);
        setLoading(false);
        setBills([]);
      }
    };
    
    fetchBills();
  }, []);
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  // Apply filters to bills
  const filteredBills = bills.filter(bill => {
    // Filter by date range
    if (filters.startDate && new Date(bill.createdAt) < new Date(filters.startDate)) {
      return false;
    }
    
    if (filters.endDate && new Date(bill.createdAt) > new Date(filters.endDate)) {
      return false;
    }
    
    // Filter by payment status
    if (filters.paymentStatus && bill.paymentStatus !== filters.paymentStatus) {
      return false;
    }
    
    // Filter by payment method
    if (filters.paymentMethod && bill.paymentMethod !== filters.paymentMethod) {
      return false;
    }
    
    // Filter by license plate
    if (filters.licensePlate && bill.customer?.vehicleInfo?.licensePlate) {
      if (!bill.customer.vehicleInfo.licensePlate.toLowerCase().includes(filters.licensePlate.toLowerCase())) {
        return false;
      }
    } else if (filters.licensePlate) {
      return false; // No license plate to match against
    }
    
    // Filter by customer name
    if (filters.customerName && bill.customer?.name) {
      if (!bill.customer.name.toLowerCase().includes(filters.customerName.toLowerCase())) {
        return false;
      }
    } else if (filters.customerName) {
      return false; // No customer name to match against
    }
    
    return true;
  });
  
  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      paymentStatus: '',
      paymentMethod: '',
      licensePlate: '',
      customerName: ''
    });
  };
  
  // Get payment status chip color
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Generate PDF for bill
  const generatePDF = (bill) => {
    try {
      // Create a new PDF document
      const doc = new jsPDF();
      
      // Set font size and styles
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Service Station Management System', 105, 20, { align: 'center' });
      
      doc.setFontSize(18);
      doc.text('INVOICE', 105, 30, { align: 'center' });
      
      // Add a line
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);
      
      // Customer and vehicle information
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      // Left column - Customer info
      let y = 45;
      doc.text(`Customer: ${bill.customer?.name || 'N/A'}`, 20, y);
      doc.text(`Phone: ${bill.customer?.phone || 'N/A'}`, 20, y + 7);
      doc.text(`Vehicle: ${bill.customer?.vehicleInfo?.make || 'N/A'} ${bill.customer?.vehicleInfo?.model || ''} (${bill.customer?.vehicleInfo?.year || ''})`, 20, y + 14);
      doc.text(`License Plate: ${bill.customer?.vehicleInfo?.licensePlate || 'N/A'}`, 20, y + 21);
      
      // Right column - Invoice info
      doc.text(`Date: ${new Date(bill.createdAt || bill.date).toLocaleDateString()}`, 120, y);
      doc.text(`Invoice #: ${bill.id.substring(0, 10)}`, 120, y + 7);
      doc.text(`Payment Method: ${bill.paymentMethod ? bill.paymentMethod.charAt(0).toUpperCase() + bill.paymentMethod.slice(1) : 'Cash'}`, 120, y + 14);
      
      // Add another line
      y = 75;
      doc.line(20, y, 190, y);
      
      // Services header
      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Services', 20, y);
      doc.text('Price', 170, y, { align: 'right' });
      
      // Services list
      doc.setFont('helvetica', 'normal');
      y += 7;
      
      if (bill.services && bill.services.length > 0) {
        bill.services.forEach(service => {
          doc.text(service.name || 'Service', 20, y);
          doc.text(`$${(service.price || 0).toFixed(2)}`, 170, y, { align: 'right' });
          y += 7;
        });
      } else {
        doc.text('No services', 20, y);
        y += 7;
      }
      
      // Products header
      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Products', 20, y);
      doc.text('Qty', 130, y, { align: 'center' });
      doc.text('Price', 170, y, { align: 'right' });
      
      // Products list
      doc.setFont('helvetica', 'normal');
      y += 7;
      
      if (bill.products && bill.products.length > 0) {
        bill.products.forEach(product => {
          doc.text(product.name || 'Product', 20, y);
          doc.text(`${product.quantity || 1}`, 130, y, { align: 'center' });
          doc.text(`$${(product.price * (product.quantity || 1)).toFixed(2)}`, 170, y, { align: 'right' });
          y += 7;
        });
      } else {
        doc.text('No products', 20, y);
        y += 7;
      }
      
      // Add a line before totals
      y += 5;
      doc.line(100, y, 190, y);
      y += 10;
      
      // Totals
      doc.text('Subtotal:', 130, y);
      doc.text(`$${bill.subtotal ? bill.subtotal.toFixed(2) : '0.00'}`, 170, y, { align: 'right' });
      y += 7;
      
      doc.text('Tax:', 130, y);
      doc.text(`$${bill.tax ? bill.tax.toFixed(2) : '0.00'}`, 170, y, { align: 'right' });
      y += 7;
      
      if (bill.discount) {
        doc.text('Discount:', 130, y);
        doc.text(`$${bill.discount.toFixed(2)}`, 170, y, { align: 'right' });
        y += 7;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL:', 130, y);
      doc.text(`$${bill.total ? bill.total.toFixed(2) : '0.00'}`, 170, y, { align: 'right' });
      
      // Add notes if any
      if (bill.notes) {
        y += 15;
        doc.setFont('helvetica', 'italic');
        doc.text('Notes:', 20, y);
        doc.setFont('helvetica', 'normal');
        doc.text(bill.notes, 20, y + 7);
      }
      
      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Thank you for your business!', 105, 280, { align: 'center' });
      
      // Save the PDF with a filename based on the bill ID
      doc.save(`Invoice-${bill.id.substring(0, 10)}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
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
          Bills
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/billing/new')}
        >
          New Bill
        </Button>
      </Box>
      
      {/* Filters */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterListIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Filters</Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Payment Status"
              name="paymentStatus"
              value={filters.paymentStatus}
              onChange={handleFilterChange}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="refunded">Refunded</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Payment Method"
              name="paymentMethod"
              value={filters.paymentMethod}
              onChange={handleFilterChange}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="card">Card</MenuItem>
              <MenuItem value="online">Online</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="License Plate"
              name="licensePlate"
              value={filters.licensePlate}
              onChange={handleFilterChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Customer Name"
              name="customerName"
              value={filters.customerName}
              onChange={handleFilterChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Bills Table */}
      <Paper elevation={3} sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Bill Number</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>License Plate</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Payment Status</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBills
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((bill) => (
                  <TableRow key={bill.id} hover>
                    <TableCell>{bill.id}</TableCell>
                    <TableCell>{bill.customer?.name || 'N/A'}</TableCell>
                    <TableCell>{bill.customer?.vehicleInfo?.licensePlate || 'N/A'}</TableCell>
                    <TableCell>{formatDate(bill.createdAt)}</TableCell>
                    <TableCell>${bill.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={(bill.paymentStatus ? bill.paymentStatus.charAt(0).toUpperCase() + bill.paymentStatus.slice(1) : 'Completed')} 
                        color={getPaymentStatusColor(bill.paymentStatus || 'completed')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {bill.paymentMethod ? bill.paymentMethod.charAt(0).toUpperCase() + bill.paymentMethod.slice(1) : 'Cash'}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => navigate(`/billing/${bill.id}`)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Print Bill">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => generatePDF(bill)}
                        >
                          <PrintIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredBills.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No bills found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredBills.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default BillList;
