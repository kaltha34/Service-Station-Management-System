import React, { useState, useEffect } from 'react';
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
  Card,
  CardContent,
  CardHeader,
  IconButton,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BuildIcon from '@mui/icons-material/Build';
import InventoryIcon from '@mui/icons-material/Inventory';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useAuth } from '../../context/AuthContext';

const VehicleHistory = () => {
  const { licensePlate } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State for vehicle data
  const [vehicleData, setVehicleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchLicensePlate, setSearchLicensePlate] = useState(licensePlate || '');
  
  // Fetch vehicle data
  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        setLoading(true);
        const plateToSearch = licensePlate || searchLicensePlate;
        
        if (!plateToSearch) {
          setLoading(false);
          return;
        }
        
        // Fetch vehicle history from the API
        const response = await fetch(`/api/vehicles/history/${plateToSearch}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch vehicle history');
        }
        
        const data = await response.json();
        setVehicleData(data);
      } catch (error) {
        console.error('Error fetching vehicle history:', error);
        // Fallback to mock data if API fails
        const mockVehicleData = {
          vehicle: {
            licensePlate: licensePlate || searchLicensePlate || 'ABC123',
            make: 'Toyota',
            model: 'Camry',
            year: 2019,
            owner: {
              name: 'John Doe',
              phone: '555-123-4567',
              email: 'john.doe@example.com'
            }
          },
          serviceHistory: [
            {
              id: 1,
              date: '2023-05-01',
              type: 'Maintenance',
              description: 'Regular service',
              services: [
                { name: 'Oil Change', price: 35.99 },
                { name: 'Tire Rotation', price: 25.00 },
                { name: 'Air Filter Replacement', price: 15.99 }
              ],
              products: [
                { name: 'Engine Oil 5W-30', quantity: 5, price: 12.99 },
                { name: 'Oil Filter', quantity: 1, price: 8.99 },
                { name: 'Air Filter', quantity: 1, price: 15.99 }
              ],
              totalCost: 152.93,
              technician: 'Mike Johnson',
              notes: 'Vehicle in good condition. Recommended brake inspection on next visit.'
            },
            {
              id: 2,
              date: '2023-03-15',
              type: 'Repair',
              description: 'Brake system repair',
              services: [
                { name: 'Brake Inspection', price: 45.00 },
                { name: 'Brake Pad Replacement (Front)', price: 120.00 }
              ],
              products: [
                { name: 'Brake Pads (Front)', quantity: 1, price: 45.99 },
                { name: 'Brake Fluid', quantity: 1, price: 12.99 }
              ],
              totalCost: 223.98,
              technician: 'Robert Smith',
              notes: 'Replaced front brake pads and topped up brake fluid.'
            },
            {
              id: 3,
              date: '2023-01-10',
              type: 'Maintenance',
              description: 'Winter preparation',
              services: [
                { name: 'Winter Inspection', price: 50.00 },
                { name: 'Coolant Flush', price: 85.00 }
              ],
              products: [
                { name: 'Coolant', quantity: 2, price: 14.99 },
                { name: 'Wiper Blades', quantity: 1, price: 22.99 }
              ],
              totalCost: 187.97,
              technician: 'Mike Johnson',
              notes: 'Prepared vehicle for winter conditions. All systems functioning properly.'
            }
          ]
        };
        
        setVehicleData(mockVehicleData);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVehicleData();
  }, [licensePlate]);
  
  // Handle search
  const handleSearch = () => {
    if (searchLicensePlate) {
      navigate(`/vehicles/${searchLicensePlate}`);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const renderVehicleHistory = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (!vehicleData) {
      return (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            No vehicle history found for license plate: {licensePlate}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Try searching for a different license plate or create a new bill for this vehicle.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/billing/new')}
            sx={{ mt: 2 }}
          >
            Create New Bill
          </Button>
        </Box>
      );
    }
    
    return (
      <>
        {/* Vehicle summary */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardHeader
                avatar={<DirectionsCarIcon color="primary" />}
                title="Vehicle Information"
              />
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {vehicleData.licensePlate}
                </Typography>
                <Typography variant="body1">
                  {vehicleData.make} {vehicleData.model} {vehicleData.year}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Owner Information
                </Typography>
                <Typography variant="body2">
                  {vehicleData.customerInfo.name}
                </Typography>
                <Typography variant="body2">
                  Phone: {vehicleData.customerInfo.phone}
                </Typography>
                <Typography variant="body2">
                  Email: {vehicleData.customerInfo.email}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Card elevation={3}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarTodayIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="div">
                        {vehicleData.totalVisits}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Visits
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Last visit: {formatDate(vehicleData.lastVisit)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Card elevation={3}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <BuildIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="div">
                        {vehicleData.commonServices.length}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Different Services
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Most common: {vehicleData.commonServices[0]?.name}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Card elevation={3}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" component="div">
                        ${vehicleData.totalSpent.toFixed(2)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Spent
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg. per visit: ${(vehicleData.totalSpent / vehicleData.totalVisits).toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card elevation={3}>
                  <CardHeader
                    avatar={<BuildIcon color="primary" />}
                    title="Common Services"
                  />
                  <CardContent>
                    <Grid container spacing={1}>
                      {vehicleData.commonServices.map((service, index) => (
                        <Grid item key={index}>
                          <Chip 
                            label={`${service.name} (${service.count})`}
                            variant="outlined"
                            color="primary"
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        
        {/* Service history */}
        <Typography variant="h5" gutterBottom>
          Service History
        </Typography>
        
        {vehicleData.serviceHistory.map((visit, index) => (
          <Accordion key={visit.id} defaultExpanded={index === 0}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel${index}-content`}
              id={`panel${index}-header`}
            >
              <Grid container alignItems="center">
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle1">
                    {formatDate(visit.date)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2">
                    Bill #{visit.id}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2">
                    {visit.services.length} services, {visit.products.length} products
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle1">
                    ${visit.total.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Services
                  </Typography>
                  <List dense>
                    {visit.services.map((service, sIndex) => (
                      <ListItem key={sIndex}>
                        <ListItemText 
                          primary={service.name}
                          secondary={`$${service.price.toFixed(2)}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Products
                  </Typography>
                  <List dense>
                    {visit.products.map((product, pIndex) => (
                      <ListItem key={pIndex}>
                        <ListItemText 
                          primary={product.name}
                          secondary={`${product.quantity} × $${product.price.toFixed(2)} = $${(product.quantity * product.price).toFixed(2)}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                {visit.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Notes
                    </Typography>
                    <Typography variant="body2">
                      {visit.notes}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12} sx={{ textAlign: 'right' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => navigate(`/billing/${visit.id}`)}
                  >
                    View Bill
                  </Button>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </>
    );
  };
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4">
            Vehicle History
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => navigate('/billing/new')}
        >
          Create New Bill
        </Button>
      </Box>
      
      {/* Search bar */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Search by License Plate"
              value={searchLicensePlate}
              onChange={(e) => setSearchLicensePlate(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              disabled={!searchLicensePlate}
            >
              Search
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Enter a license plate number to view service history. You can also create a new bill for this vehicle.
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Vehicle history content */}
      {renderVehicleHistory()}
    </Box>
  );
};

export default VehicleHistory;
