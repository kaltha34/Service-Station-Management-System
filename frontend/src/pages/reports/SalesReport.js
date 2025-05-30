import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  TextField, 
  Button, 
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BuildIcon from '@mui/icons-material/Build';
import PrintIcon from '@mui/icons-material/Print';
import jsPDF from 'jspdf';

const SalesReport = () => {
  const [reportType, setReportType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bills, setBills] = useState([]);
  const [reportData, setReportData] = useState({
    totalSales: 0,
    totalBills: 0,
    productSales: 0,
    serviceSales: 0,
    paymentMethods: {
      cash: 0,
      card: 0,
      online: 0,
      other: 0
    }
  });

  // Load bills from localStorage
  useEffect(() => {
    const storedBills = JSON.parse(localStorage.getItem('bills') || '[]');
    setBills(storedBills);
  }, []);

  // Generate report when report type or date changes
  useEffect(() => {
    generateReport();
  }, [reportType, selectedDate, bills]);

  // Helper function to format date
  const formatDate = (date) => {
    if (!date) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString(undefined, options);
  };

  // Helper function to get start of day
  const getStartOfDay = (date) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  };

  // Helper function to get end of day
  const getEndOfDay = (date) => {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  };

  // Helper function to get start of week (Monday)
  const getStartOfWeek = (date) => {
    const newDate = new Date(date);
    const day = newDate.getDay();
    const diff = newDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    newDate.setDate(diff);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  };

  // Helper function to get end of week (Sunday)
  const getEndOfWeek = (date) => {
    const newDate = getStartOfWeek(date);
    newDate.setDate(newDate.getDate() + 6);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  };

  // Helper function to get start of month
  const getStartOfMonth = (date) => {
    const newDate = new Date(date);
    newDate.setDate(1);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  };

  // Helper function to get end of month
  const getEndOfMonth = (date) => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + 1);
    newDate.setDate(0);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  };

  // Function to get date range based on report type
  const getDateRange = () => {
    switch (reportType) {
      case 'daily':
        return {
          start: getStartOfDay(selectedDate),
          end: getEndOfDay(selectedDate),
          title: formatDate(selectedDate)
        };
      case 'weekly':
        const weekStart = getStartOfWeek(selectedDate);
        const weekEnd = getEndOfWeek(selectedDate);
        return {
          start: weekStart,
          end: weekEnd,
          title: `Week of ${formatDate(weekStart)} - ${formatDate(weekEnd)}`
        };
      case 'monthly':
        return {
          start: getStartOfMonth(selectedDate),
          end: getEndOfMonth(selectedDate),
          title: new Date(selectedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
        };
      default:
        return {
          start: getStartOfDay(selectedDate),
          end: getEndOfDay(selectedDate),
          title: formatDate(selectedDate)
        };
    }
  };

  // Generate report data
  const generateReport = () => {
    const { start, end } = getDateRange();
    
    // Filter bills by date range
    const filteredBills = bills.filter(bill => {
      const billDate = new Date(bill.createdAt);
      return billDate >= start && billDate <= end;
    });
    
    // Calculate totals
    let totalSales = 0;
    let productSales = 0;
    let serviceSales = 0;
    let paymentMethods = {
      cash: 0,
      card: 0,
      online: 0,
      other: 0
    };
    
    filteredBills.forEach(bill => {
      const total = bill.total || 0;
      totalSales += total;
      
      // Calculate product and service sales
      if (bill.products && bill.products.length > 0) {
        bill.products.forEach(product => {
          productSales += (product.price || 0) * (product.quantity || 1);
        });
      }
      
      if (bill.services && bill.services.length > 0) {
        bill.services.forEach(service => {
          serviceSales += (service.price || 0) * (service.quantity || 1);
        });
      }
      
      // Count payment methods
      const method = bill.paymentMethod || 'cash';
      if (paymentMethods.hasOwnProperty(method)) {
        paymentMethods[method] += total;
      } else {
        paymentMethods.other += total;
      }
    });
    
    // Update report data
    setReportData({
      totalSales,
      totalBills: filteredBills.length,
      productSales,
      serviceSales,
      paymentMethods,
      filteredBills
    });
  };

  // Handle report type change
  const handleReportTypeChange = (event) => {
    setReportType(event.target.value);
  };

  // Handle date change
  const handleDateChange = (event) => {
    setSelectedDate(new Date(event.target.value));
  };

  // Navigate to previous period
  const handlePrevious = () => {
    const newDate = new Date(selectedDate);
    switch (reportType) {
      case 'daily':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'weekly':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      default:
        break;
    }
    setSelectedDate(newDate);
  };

  // Navigate to next period
  const handleNext = () => {
    const newDate = new Date(selectedDate);
    switch (reportType) {
      case 'daily':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'weekly':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      default:
        break;
    }
    setSelectedDate(newDate);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  // Generate PDF report
  const generatePDF = () => {
    try {
      const { title } = getDateRange();
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Sales Report', 105, 20, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text(title, 105, 30, { align: 'center' });
      
      // Add summary
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Bills: ${reportData.totalBills}`, 20, 45);
      doc.text(`Total Sales: ${formatCurrency(reportData.totalSales)}`, 20, 55);
      doc.text(`Product Sales: ${formatCurrency(reportData.productSales)}`, 20, 65);
      doc.text(`Service Sales: ${formatCurrency(reportData.serviceSales)}`, 20, 75);
      
      // Add payment methods
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Methods:', 120, 45);
      doc.setFont('helvetica', 'normal');
      doc.text(`Cash: ${formatCurrency(reportData.paymentMethods.cash)}`, 120, 55);
      doc.text(`Card: ${formatCurrency(reportData.paymentMethods.card)}`, 120, 65);
      doc.text(`Online: ${formatCurrency(reportData.paymentMethods.online)}`, 120, 75);
      doc.text(`Other: ${formatCurrency(reportData.paymentMethods.other)}`, 120, 85);
      
      // Add transactions table
      if (reportData.filteredBills && reportData.filteredBills.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Transactions:', 20, 100);
        
        // Draw table header
        doc.setFillColor(66, 66, 66);
        doc.setTextColor(255, 255, 255);
        doc.rect(20, 105, 170, 10, 'F');
        doc.text('Bill #', 25, 112);
        doc.text('Customer', 55, 112);
        doc.text('License Plate', 85, 112);
        doc.text('Date', 115, 112);
        doc.text('Amount', 140, 112);
        doc.text('Payment', 165, 112);
        
        // Draw table rows
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        
        let y = 125;
        const maxBills = Math.min(reportData.filteredBills.length, 15); // Limit to 15 bills to fit on page
        
        for (let i = 0; i < maxBills; i++) {
          const bill = reportData.filteredBills[i];
          const billId = bill.billNumber || bill._id || bill.id || 'Unknown';
          const customer = bill.customer?.name || 'N/A';
          const licensePlate = bill.customer?.vehicleInfo?.licensePlate || 'N/A';
          const date = new Date(bill.createdAt).toLocaleDateString();
          const amount = formatCurrency(bill.total || 0);
          const payment = bill.paymentMethod ? bill.paymentMethod.charAt(0).toUpperCase() + bill.paymentMethod.slice(1) : 'Cash';
          
          // Draw alternating row background
          if (i % 2 === 0) {
            doc.setFillColor(240, 240, 240);
            doc.rect(20, y - 6, 170, 10, 'F');
          }
          
          // Draw row content
          doc.text(billId.substring(0, 10), 25, y);
          doc.text(customer.substring(0, 15), 55, y);
          doc.text(licensePlate, 85, y);
          doc.text(date, 115, y);
          doc.text(amount, 140, y);
          doc.text(payment, 165, y);
          
          y += 10;
        }
        
        if (reportData.filteredBills.length > maxBills) {
          doc.text(`... and ${reportData.filteredBills.length - maxBills} more transactions`, 105, y + 10, { align: 'center' });
        }
      }
      
      // Save PDF
      const fileName = `Sales_Report_${title.replace(/\s/g, '_')}.pdf`;
      doc.save(fileName);
      console.log('PDF generated:', fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  const { title } = getDateRange();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Sales Report
        </Typography>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={generatePDF}
        >
          Export PDF
        </Button>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id="report-type-label">Report Type</InputLabel>
              <Select
                labelId="report-type-label"
                id="report-type"
                value={reportType}
                label="Report Type"
                onChange={handleReportTypeChange}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              type="date"
              label="Select Date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={handleDateChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={handlePrevious}>Previous</Button>
              <Button variant="outlined" onClick={handleNext}>Next</Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Typography variant="h5" sx={{ mb: 2 }}>
        {title}
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Total Sales</Typography>
              </Box>
              <Typography variant="h4">{formatCurrency(reportData.totalSales)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ReceiptIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Total Bills</Typography>
              </Box>
              <Typography variant="h4">{reportData.totalBills}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShoppingCartIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Product Sales</Typography>
              </Box>
              <Typography variant="h4">{formatCurrency(reportData.productSales)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BuildIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Service Sales</Typography>
              </Box>
              <Typography variant="h4">{formatCurrency(reportData.serviceSales)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Payment Methods</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Method</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Cash</TableCell>
                    <TableCell align="right">{formatCurrency(reportData.paymentMethods.cash)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Card</TableCell>
                    <TableCell align="right">{formatCurrency(reportData.paymentMethods.card)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Online</TableCell>
                    <TableCell align="right">{formatCurrency(reportData.paymentMethods.online)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Other</TableCell>
                    <TableCell align="right">{formatCurrency(reportData.paymentMethods.other)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Sales Distribution</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 'calc(100% - 30px)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <Typography variant="body2" color="text.secondary">Products</Typography>
                  <Box sx={{ width: '100%', bgcolor: 'background.paper', height: 20, position: 'relative' }}>
                    <Box
                      sx={{
                        width: `${reportData.totalSales ? (reportData.productSales / reportData.totalSales) * 100 : 0}%`,
                        bgcolor: 'primary.main',
                        height: '100%'
                      }}
                    />
                  </Box>
                </Box>
                <Typography variant="body2">{reportData.totalSales ? ((reportData.productSales / reportData.totalSales) * 100).toFixed(1) : 0}%</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <Typography variant="body2" color="text.secondary">Services</Typography>
                  <Box sx={{ width: '100%', bgcolor: 'background.paper', height: 20, position: 'relative' }}>
                    <Box
                      sx={{
                        width: `${reportData.totalSales ? (reportData.serviceSales / reportData.totalSales) * 100 : 0}%`,
                        bgcolor: 'secondary.main',
                        height: '100%'
                      }}
                    />
                  </Box>
                </Box>
                <Typography variant="body2">{reportData.totalSales ? ((reportData.serviceSales / reportData.totalSales) * 100).toFixed(1) : 0}%</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>Transactions</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Bill Number</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>License Plate</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Payment Method</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.filteredBills && reportData.filteredBills.length > 0 ? (
                reportData.filteredBills.map((bill) => (
                  <TableRow key={bill._id || bill.id}>
                    <TableCell>{bill.billNumber || bill._id || bill.id}</TableCell>
                    <TableCell>{bill.customer?.name || 'N/A'}</TableCell>
                    <TableCell>{bill.customer?.vehicleInfo?.licensePlate || 'N/A'}</TableCell>
                    <TableCell>{new Date(bill.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="right">{formatCurrency(bill.total || 0)}</TableCell>
                    <TableCell>
                      {bill.paymentMethod ? bill.paymentMethod.charAt(0).toUpperCase() + bill.paymentMethod.slice(1) : 'Cash'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No transactions found for this period
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default SalesReport;
