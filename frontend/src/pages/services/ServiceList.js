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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../../context/AuthContext';

const ServiceList = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  
  // State for services
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // State for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  
  // Fetch services from localStorage
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        
        // Get services from localStorage
        const storedServices = JSON.parse(localStorage.getItem('services') || '[]');
        
        setServices(storedServices);
        setLoading(false);
      } catch (error) {
        console.error('Error loading services:', error);
        setLoading(false);
        setServices([]);
      }
    };
    
    fetchServices();
  }, []);
  
  // Filter services based on search term and category
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? service.category === categoryFilter : true;
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
  
  // Handle edit service
  const handleEditService = (id) => {
    navigate(`/services/edit/${id}`);
  };
  
  // Handle delete service
  const handleDeleteClick = (service) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    try {
      // Get current services from localStorage
      const storedServices = JSON.parse(localStorage.getItem('services') || '[]');
      
      // Filter out the service to delete
      const updatedServices = storedServices.filter(s => s.id !== serviceToDelete.id);
      
      // Update localStorage
      localStorage.setItem('services', JSON.stringify(updatedServices));
      
      // Update state
      setServices(updatedServices);
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setServiceToDelete(null);
  };
  
  // Get category display name
  const getCategoryDisplayName = (category) => {
    switch (category) {
      case 'maintenance':
        return 'Maintenance';
      case 'inspection':
        return 'Inspection';
      case 'wash':
        return 'Wash & Detailing';
      case 'repair':
        return 'Repair';
      default:
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };
  
  // Format duration in minutes to hours and minutes
  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }
    
    return `${hours} hr ${remainingMinutes} min`;
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
          Services
        </Typography>
        {hasRole(['admin', 'staff']) && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/services/new')}
          >
            Add Service
          </Button>
        )}
      </Box>
      
      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Search Services"
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
            onChange={(e) => handleCategoryChange(e)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All Categories</MenuItem>
            <MenuItem value="maintenance">Maintenance</MenuItem>
            <MenuItem value="inspection">Inspection</MenuItem>
            <MenuItem value="wash">Wash & Detailing</MenuItem>
            <MenuItem value="repair">Repair</MenuItem>
          </TextField>
        </Box>
      </Paper>
      
      {/* Services Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredServices
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>{service.name}</TableCell>
                    <TableCell>{service.description}</TableCell>
                    <TableCell>
                      {getCategoryDisplayName(service.category)}
                    </TableCell>
                    <TableCell align="right">${service.price.toFixed(2)}</TableCell>
                    <TableCell>{formatDuration(service.duration)}</TableCell>
                    <TableCell>
                      <Chip
                        label={service.active ? 'Active' : 'Inactive'}
                        color={service.active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {hasRole(['admin', 'staff']) && (
                        <>
                          <IconButton 
                            color="primary" 
                            onClick={() => handleEditService(service.id)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            color="error" 
                            onClick={() => handleDeleteClick(service)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              {filteredServices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No services found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredServices.length}
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
            Are you sure you want to delete the service "{serviceToDelete?.name}"? This action cannot be undone.
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

export default ServiceList;
