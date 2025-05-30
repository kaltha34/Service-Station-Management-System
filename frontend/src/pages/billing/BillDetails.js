import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Button, 
  Divider, 
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Alert
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../../context/AuthContext';

const BillDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const printRef = useRef();
  
  // State for bill data
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State for payment status dialog
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  
  // State for snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Fetch bill data from localStorage
  useEffect(() => {
    const fetchBill = async () => {
      try {
        setLoading(true);
        
        // Get bills from localStorage
        const storedBills = JSON.parse(localStorage.getItem('bills') || '[]');
        
        // Find the bill with the matching ID
        const foundBill = storedBills.find(bill => bill._id === id || bill.id === id);
        
        if (foundBill) {
          console.log('Found bill in localStorage:', foundBill);
          setBill(foundBill);
        } else {
          console.error('Bill not found with ID:', id);
          setSnackbar({
            open: true,
            message: 'Bill not found',
            severity: 'error'
          });
          // Navigate back to bills list after a short delay
          setTimeout(() => {
            navigate('/billing');
          }, 2000);
        }
        
        // Set payment status and method from the found bill
        if (foundBill) {
          setPaymentStatus(foundBill.paymentStatus || 'completed');
          setPaymentMethod(foundBill.paymentMethod || 'cash');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching bill:', error);
        setLoading(false);
      }
    };
    
    fetchBill();
  }, [id]);
  
  // Handle print functionality
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Bill-${id}`,
  });
  
  // Handle payment status dialog
  const handleOpenPaymentDialog = () => {
    setPaymentDialog(true);
  };
  
  const handleClosePaymentDialog = () => {
    setPaymentDialog(false);
  };
  
  const handleUpdatePayment = async () => {
    try {
      // Get all bills from localStorage
      const storedBills = JSON.parse(localStorage.getItem('bills') || '[]');
      
      // Find the bill index
      const billIndex = storedBills.findIndex(b => b._id === id || b.id === id);
      
      if (billIndex !== -1) {
        // Update the bill with new payment information
        const updatedBill = {
          ...storedBills[billIndex],
          paymentStatus,
          paymentMethod
        };
        
        // Update the bill in the array
        storedBills[billIndex] = updatedBill;
        
        // Save back to localStorage
        localStorage.setItem('bills', JSON.stringify(storedBills));
        
        // Update state
        setBill(updatedBill);
        
        setSnackbar({
          open: true,
          message: 'Payment status updated successfully',
          severity: 'success'
        });
      } else {
        throw new Error('Bill not found in localStorage');
      }
      
      handleClosePaymentDialog();
    } catch (error) {
      console.error('Error updating payment status:', error);
      
      setSnackbar({
        open: true,
        message: 'Failed to update payment status',
        severity: 'error'
      });
    }
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
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!bill) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Bill not found
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/billing')}
          sx={{ mt: 2 }}
        >
          Back to Bills
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/billing')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4">
            Bill #{bill.billNumber}
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ mr: 1 }}
          >
            Print
          </Button>
          {hasRole(['admin', 'cashier']) && bill.paymentStatus !== 'completed' && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleOpenPaymentDialog}
            >
              Update Payment
            </Button>
          )}
        </Box>
      </Box>
      
      {/* Bill content for printing */}
      <Box ref={printRef} sx={{ p: 2 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2, mb: 3 }}>
          {/* Bill header */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="h5" gutterBottom>
                Service Station
              </Typography>
              <Typography variant="body2">
                123 Service Road, Anytown
              </Typography>
              <Typography variant="body2">
                Phone: (555) 123-4567
              </Typography>
              <Typography variant="body2">
                Email: info@servicestation.com
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} sx={{ textAlign: { sm: 'right' } }}>
              <Typography variant="h6" gutterBottom>
                Bill #{bill.billNumber}
              </Typography>
              <Typography variant="body2">
                Date: {formatDate(bill.createdAt)}
              </Typography>
              <Typography variant="body2">
                Created by: {bill.createdBy?.name || 'System'}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                <Chip 
                  label={bill.paymentStatus ? (bill.paymentStatus.charAt(0).toUpperCase() + bill.paymentStatus.slice(1)) : 'Completed'} 
                  color={getPaymentStatusColor(bill.paymentStatus || 'completed')}
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>
          
          <Divider sx={{ mb: 3 }} />
          
          {/* Customer information */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="h6" gutterBottom>
                Customer Information
              </Typography>
              <Typography variant="body1">
                {bill.customer?.name || 'Customer'}
              </Typography>
              {bill.customer?.phone && (
                <Typography variant="body2">
                  Phone: {bill.customer.phone}
                </Typography>
              )}
              {bill.customer?.email && (
                <Typography variant="body2">
                  Email: {bill.customer.email}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <DirectionsCarIcon sx={{ mr: 1 }} />
                Vehicle Information
              </Typography>
              <Typography variant="body1">
                License Plate: {bill.customer?.vehicleInfo?.licensePlate || 'N/A'}
              </Typography>
              {bill.customer?.vehicleInfo?.make && (
                <Typography variant="body2">
                  {bill.customer.vehicleInfo.make} {bill.customer.vehicleInfo.model} {bill.customer.vehicleInfo.year}
                </Typography>
              )}
              <Button 
                variant="text" 
                size="small" 
                sx={{ mt: 1 }}
                onClick={() => navigate(`/vehicles/${bill.customer?.vehicleInfo?.licensePlate || 'unknown'}`)}
                className="no-print"
              >
                View Service History
              </Button>
            </Grid>
          </Grid>
          
          <Divider sx={{ mb: 3 }} />
          
          {/* Services */}
          {bill.services && bill.services.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Services
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Service</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bill.services.map((service, index) => (
                      <TableRow key={service.id || index}>
                        <TableCell>{service.name || 'Unknown Service'}</TableCell>
                        <TableCell align="right">${(service.price || 0).toFixed(2)}</TableCell>
                        <TableCell align="right">{service.quantity || 1}</TableCell>
                        <TableCell align="right">${((service.price || 0) * (service.quantity || 1)).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <Typography variant="subtitle1">Services Subtotal:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle1">
                          ${bill.services.reduce((sum, service) => sum + ((service.price || 0) * (service.quantity || 1)), 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
          
          {/* Products */}
          {bill.products && bill.products.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Products
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bill.products.map((product, index) => (
                      <TableRow key={product.id || index}>
                        <TableCell>{product.name || 'Unknown Product'}</TableCell>
                        <TableCell align="right">${(product.price || 0).toFixed(2)}</TableCell>
                        <TableCell align="right">{product.quantity || 1}</TableCell>
                        <TableCell align="right">${((product.price || 0) * (product.quantity || 1)).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <Typography variant="subtitle1">Products Subtotal:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle1">
                          ${bill.products.reduce((sum, product) => sum + ((product.price || 0) * (product.quantity || 1)), 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
          
          <Divider sx={{ mb: 3 }} />
          
          {/* Bill summary */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1" gutterBottom>
                <strong>Payment Method:</strong> {bill.paymentMethod ? (bill.paymentMethod.charAt(0).toUpperCase() + bill.paymentMethod.slice(1)) : 'Cash'}
              </Typography>
              {bill.notes && (
                <>
                  <Typography variant="body1" gutterBottom>
                    <strong>Notes:</strong>
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {bill.notes}
                  </Typography>
                </>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body1">Subtotal:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1" align="right">
                      ${(bill.subtotal || 0).toFixed(2)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body1">
                      Tax ({((bill.taxRate || 0) * 100).toFixed(0)}%):
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1" align="right">
                      ${(bill.taxAmount || 0).toFixed(2)}
                    </Typography>
                  </Grid>
                  
                  {bill.discount > 0 && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body1">Discount:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1" align="right" color="error">
                          -${(bill.discount || 0).toFixed(2)}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="h6">Total:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h6" align="right">
                      ${(bill.total || 0).toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
          
          {/* Footer */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Thank you for your business!
            </Typography>
          </Box>
        </Paper>
      </Box>
      
      {/* Payment Status Dialog */}
      <Dialog open={paymentDialog} onClose={handleClosePaymentDialog}>
        <DialogTitle>Update Payment Status</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Payment Status"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="refunded">Refunded</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Payment Method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="card">Card</MenuItem>
                <MenuItem value="online">Online Transfer</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Cancel</Button>
          <Button 
            onClick={handleUpdatePayment} 
            variant="contained"
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BillDetails;
