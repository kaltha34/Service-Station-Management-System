import React from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Card, 
  CardContent,
  CardMedia,
  CardActionArea
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BuildIcon from '@mui/icons-material/Build';
import InventoryIcon from '@mui/icons-material/Inventory';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Service Station Management System
      </Typography>
      
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Welcome, {user?.name || 'User'}!
      </Typography>
      
      <Typography variant="body1" gutterBottom sx={{ mb: 4 }}>
        What would you like to do today?
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardActionArea onClick={() => navigate('/billing/new')}>
              <CardMedia
                component="div"
                sx={{
                  pt: 4,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <AddCircleOutlineIcon sx={{ fontSize: 60, color: '#1976d2' }} />
              </CardMedia>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Typography gutterBottom variant="h5" component="h2">
                  Create New Bill
                </Typography>
                <Typography>
                  Create a new bill for services and products
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardActionArea onClick={() => navigate('/billing')}>
              <CardMedia
                component="div"
                sx={{
                  pt: 4,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <ReceiptIcon sx={{ fontSize: 60, color: '#1976d2' }} />
              </CardMedia>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Typography gutterBottom variant="h5" component="h2">
                  View Bills
                </Typography>
                <Typography>
                  View and manage existing bills
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardActionArea onClick={() => navigate('/services')}>
              <CardMedia
                component="div"
                sx={{
                  pt: 4,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <BuildIcon sx={{ fontSize: 60, color: '#1976d2' }} />
              </CardMedia>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Typography gutterBottom variant="h5" component="h2">
                  Manage Services
                </Typography>
                <Typography>
                  Add, edit or remove service offerings
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardActionArea onClick={() => navigate('/products')}>
              <CardMedia
                component="div"
                sx={{
                  pt: 4,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <InventoryIcon sx={{ fontSize: 60, color: '#1976d2' }} />
              </CardMedia>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Typography gutterBottom variant="h5" component="h2">
                  Manage Products
                </Typography>
                <Typography>
                  Add, edit or remove product inventory
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
