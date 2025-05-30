import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Chip,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import HistoryIcon from '@mui/icons-material/History';
import WarningIcon from '@mui/icons-material/Warning';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../../context/AuthContext';

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`inventory-tabpanel-${index}`}
      aria-labelledby={`inventory-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const InventoryManagement = () => {
  const { hasRole } = useAuth();
  
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Products state
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Transaction state
  const [transactions, setTransactions] = useState([]);
  const [transactionPage, setTransactionPage] = useState(0);
  const [transactionRowsPerPage, setTransactionRowsPerPage] = useState(10);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  
  // Dialog state
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('add');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  
  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Fetch products and transactions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // In a real application, these would be API calls
        // For now, we'll use mock data
        const mockProducts = [
          { id: '1', name: 'Engine Oil 5W-30', category: 'oil', price: 80, quantityInStock: 15, lowStockThreshold: 10 },
          { id: '2', name: 'Engine Oil 10W-40', category: 'oil', price: 85, quantityInStock: 8, lowStockThreshold: 10 },
          { id: '3', name: 'Synthetic Oil', category: 'oil', price: 120, quantityInStock: 5, lowStockThreshold: 8 },
          { id: '4', name: 'Oil Filter', category: 'filter', price: 40, quantityInStock: 25, lowStockThreshold: 15 },
          { id: '5', name: 'Air Filter', category: 'filter', price: 30, quantityInStock: 18, lowStockThreshold: 12 },
          { id: '6', name: 'Cabin Filter', category: 'filter', price: 35, quantityInStock: 12, lowStockThreshold: 10 },
          { id: '7', name: 'Brake Fluid', category: 'fluid', price: 60, quantityInStock: 3, lowStockThreshold: 5 },
          { id: '8', name: 'Coolant', category: 'fluid', price: 70, quantityInStock: 0, lowStockThreshold: 5 },
          { id: '9', name: 'Wiper Blades', category: 'accessory', price: 45, quantityInStock: 20, lowStockThreshold: 10 },
          { id: '10', name: 'Spark Plugs', category: 'part', price: 15, quantityInStock: 0, lowStockThreshold: 20 }
        ];
        
        const mockTransactions = [
          { id: '1', productId: '1', productName: 'Engine Oil 5W-30', type: 'add', quantity: 10, reason: 'Initial stock', createdBy: 'John Doe', createdAt: '2025-05-25T10:30:00Z' },
          { id: '2', productId: '2', productName: 'Engine Oil 10W-40', type: 'add', quantity: 15, reason: 'Restocking', createdBy: 'John Doe', createdAt: '2025-05-26T11:15:00Z' },
          { id: '3', productId: '3', productName: 'Synthetic Oil', type: 'add', quantity: 8, reason: 'New shipment', createdBy: 'Jane Smith', createdAt: '2025-05-27T09:45:00Z' },
          { id: '4', productId: '7', productName: 'Brake Fluid', type: 'remove', quantity: 2, reason: 'Damaged goods', createdBy: 'Jane Smith', createdAt: '2025-05-28T14:20:00Z' },
          { id: '5', productId: '8', productName: 'Coolant', type: 'remove', quantity: 5, reason: 'Expired', createdBy: 'John Doe', createdAt: '2025-05-29T16:10:00Z' }
        ];
        
        setProducts(mockProducts);
        setFilteredProducts(mockProducts);
        setTransactions(mockTransactions);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching inventory data:', error);
        setLoading(false);
        setNotification({
          open: true,
          message: 'Failed to load inventory data',
          severity: 'error'
        });
      }
    };
    
    fetchData();
  }, []);
  
  // Apply filters when search term or filters change
  useEffect(() => {
    let filtered = [...products];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }
    
    // Apply stock filter
    if (stockFilter === 'low') {
      filtered = filtered.filter(product => 
        product.quantityInStock <= product.lowStockThreshold && product.quantityInStock > 0
      );
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(product => product.quantityInStock === 0);
    } else if (stockFilter === 'healthy') {
      filtered = filtered.filter(product => product.quantityInStock > product.lowStockThreshold);
    }
    
    setFilteredProducts(filtered);
    setPage(0);
  }, [products, searchTerm, categoryFilter, stockFilter]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle transaction page change
  const handleTransactionChangePage = (event, newPage) => {
    setTransactionPage(newPage);
  };
  
  // Handle transaction rows per page change
  const handleTransactionChangeRowsPerPage = (event) => {
    setTransactionRowsPerPage(parseInt(event.target.value, 10));
    setTransactionPage(0);
  };
  
  // Handle search term change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Handle filter changes
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    if (name === 'category') {
      setCategoryFilter(value);
    } else if (name === 'stock') {
      setStockFilter(value);
    }
  };
  
  // Handle opening adjustment dialog
  const handleAdjustStock = (product) => {
    setSelectedProduct(product);
    setAdjustmentQuantity('');
    setAdjustmentType('add');
    setAdjustmentReason('');
    setAdjustDialogOpen(true);
  };
  
  // Handle adjustment dialog close
  const handleCloseAdjustDialog = () => {
    setAdjustDialogOpen(false);
  };
  
  // Handle stock adjustment
  const handleStockAdjustment = () => {
    if (!adjustmentQuantity || parseInt(adjustmentQuantity) <= 0 || !adjustmentReason) {
      setNotification({
        open: true,
        message: 'Please fill in all fields with valid values',
        severity: 'error'
      });
      return;
    }
    
    try {
      // In a real application, this would be an API call
      // For now, we'll just update the state
      
      const quantity = parseInt(adjustmentQuantity);
      
      // Update product quantity
      const updatedProducts = products.map(product => {
        if (product.id === selectedProduct.id) {
          let newQuantity = product.quantityInStock;
          
          if (adjustmentType === 'add') {
            newQuantity += quantity;
          } else {
            newQuantity = Math.max(0, newQuantity - quantity);
          }
          
          return {
            ...product,
            quantityInStock: newQuantity
          };
        }
        return product;
      });
      
      // Create new transaction
      const newTransaction = {
        id: Date.now().toString(),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        type: adjustmentType,
        quantity,
        reason: adjustmentReason,
        createdBy: 'Current User',
        createdAt: new Date().toISOString()
      };
      
      setProducts(updatedProducts);
      setTransactions([newTransaction, ...transactions]);
      
      setAdjustDialogOpen(false);
      setNotification({
        open: true,
        message: 'Inventory updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adjusting stock:', error);
      setNotification({
        open: true,
        message: 'Failed to update inventory',
        severity: 'error'
      });
    }
  };
  
  // Handle notification close
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };
  
  // Check if product is low in stock
  const isLowInStock = (product) => {
    return product.quantityInStock <= product.lowStockThreshold && product.quantityInStock > 0;
  };
  
  // Check if product is out of stock
  const isOutOfStock = (product) => {
    return product.quantityInStock === 0;
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
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Inventory Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            sx={{ mr: 1 }}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            sx={{ mr: 1 }}
          >
            Import CSV
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => window.location.href = '/products/new'}
          >
            Add Product
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Current Inventory" />
          <Tab label="Transaction History" />
        </Tabs>
        
        {/* Current Inventory Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Search Products"
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Category"
                name="category"
                value={categoryFilter}
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
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Stock Status"
                name="stock"
                value={stockFilter}
                onChange={handleFilterChange}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="low">Low Stock</MenuItem>
                <MenuItem value="out">Out of Stock</MenuItem>
                <MenuItem value="healthy">Healthy Stock</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">In Stock</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((product) => (
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
                        {isOutOfStock(product) ? (
                          <Chip 
                            label="Out of Stock" 
                            color="error" 
                            size="small" 
                            icon={<WarningIcon />} 
                          />
                        ) : isLowInStock(product) ? (
                          <Chip 
                            label="Low Stock" 
                            color="warning" 
                            size="small" 
                            icon={<WarningIcon />} 
                          />
                        ) : (
                          <Chip 
                            label="In Stock" 
                            color="success" 
                            size="small" 
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleAdjustStock(product)}
                        >
                          Adjust Stock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No products found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredProducts.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TabPanel>
        
        {/* Transaction History Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>User</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions
                  .slice(transactionPage * transactionRowsPerPage, transactionPage * transactionRowsPerPage + transactionRowsPerPage)
                  .map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                      <TableCell>{transaction.productName}</TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.type === 'add' ? 'Added' : 'Removed'}
                          color={transaction.type === 'add' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{transaction.quantity}</TableCell>
                      <TableCell>{transaction.reason}</TableCell>
                      <TableCell>{transaction.createdBy}</TableCell>
                    </TableRow>
                  ))}
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No transactions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={transactions.length}
            rowsPerPage={transactionRowsPerPage}
            page={transactionPage}
            onPageChange={handleTransactionChangePage}
            onRowsPerPageChange={handleTransactionChangeRowsPerPage}
          />
        </TabPanel>
      </Paper>
      
      {/* Stock Adjustment Dialog */}
      <Dialog open={adjustDialogOpen} onClose={handleCloseAdjustDialog}>
        <DialogTitle>Adjust Stock: {selectedProduct?.name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Adjustment Type"
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value)}
              >
                <MenuItem value="add">Add Stock</MenuItem>
                <MenuItem value="remove">Remove Stock</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                type="number"
                label="Quantity"
                inputProps={{ min: 1 }}
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Reason"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdjustDialog}>Cancel</Button>
          <Button onClick={handleStockAdjustment} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InventoryManagement;
