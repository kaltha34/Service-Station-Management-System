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
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import WarningIcon from '@mui/icons-material/Warning';
import { useAuth } from '../../context/AuthContext';

const ProductList = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  
  // State for products
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // State for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  
  // Fetch products from localStorage
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Get products from localStorage
        const storedProducts = JSON.parse(localStorage.getItem('products') || '[]');
        
        setProducts(storedProducts);
        setLoading(false);
      } catch (error) {
        console.error('Error loading products:', error);
        setLoading(false);
        setProducts([]);
      }
    };
    
    fetchProducts();
  }, []);
  
  // Filter products based on search term and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? product.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle search term change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };
  
  // Handle category filter change
  const handleCategoryChange = (event) => {
    setCategoryFilter(event.target.value);
    setPage(0);
  };
  
  // Handle edit product
  const handleEditProduct = (id) => {
    navigate(`/products/edit/${id}`);
  };
  
  // Handle delete product
  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    try {
      // Get current products from localStorage
      const storedProducts = JSON.parse(localStorage.getItem('products') || '[]');
      
      // Filter out the product to delete
      const updatedProducts = storedProducts.filter(p => p.id !== productToDelete.id);
      
      // Update localStorage
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      
      // Update state
      setProducts(updatedProducts);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };
  
  // Check if product is low in stock
  const isLowInStock = (product) => {
    return product.quantityInStock <= product.lowStockThreshold;
  };
  
  // Check if product is out of stock
  const isOutOfStock = (product) => {
    return product.quantityInStock === 0;
  };
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Products
        </Typography>
        {hasRole(['admin', 'inventory_manager']) && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/products/new')}
          >
            Add Product
          </Button>
        )}
      </Box>
      
      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Search Products"
            variant="outlined"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            label="Category"
            value={categoryFilter}
            onChange={handleCategoryChange}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All Categories</MenuItem>
            <MenuItem value="oil">Oil</MenuItem>
            <MenuItem value="filter">Filter</MenuItem>
            <MenuItem value="fluid">Fluid</MenuItem>
            <MenuItem value="part">Part</MenuItem>
            <MenuItem value="accessory">Accessory</MenuItem>
          </TextField>
        </Box>
      </Paper>
      
      {/* Products Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Stock</TableCell>
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
                      {hasRole(['admin', 'inventory_manager']) && (
                        <>
                          <IconButton 
                            color="primary" 
                            onClick={() => handleEditProduct(product.id)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            color="error" 
                            onClick={() => handleDeleteClick(product)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
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
      </Paper>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {productToDelete?.name}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductList;
