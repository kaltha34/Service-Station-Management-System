import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useTheme } from '@mui/material/styles';

const NotFound = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          py: 5
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 100, color: theme.palette.error.main, mb: 2 }} />
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 600, mb: 4 }}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/')}
        >
          Go to Dashboard
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;
