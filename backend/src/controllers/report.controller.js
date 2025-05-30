const Bill = require('../models/bill.model');
const Service = require('../models/service.model');
const Product = require('../models/product.model');
const InventoryTransaction = require('../models/inventory-transaction.model');
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');

/**
 * Generate daily sales report
 * @route GET /api/reports/daily
 * @access Private (admin, manager)
 */
exports.generateDailyReport = async (req, res) => {
  try {
    const { date, staffId, category } = req.query;
    
    // Set date range for the report
    const reportDate = date ? new Date(date) : new Date();
    const startDate = new Date(reportDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(reportDate);
    endDate.setHours(23, 59, 59, 999);
    
    // Build query
    const query = {
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    };
    
    // Filter by staff if provided
    if (staffId) {
      query.createdBy = mongoose.Types.ObjectId(staffId);
    }
    
    // Get bills for the day
    const bills = await Bill.find(query)
      .populate('createdBy', 'name')
      .populate('services.service', 'name category')
      .populate('products.product', 'name category');
    
    // Initialize report data
    const reportData = {
      date: reportDate,
      totalBills: bills.length,
      totalAmount: 0,
      services: {},
      products: {},
      paymentMethods: {
        cash: 0,
        card: 0,
        online: 0,
        other: 0
      },
      paymentStatus: {
        completed: 0,
        pending: 0,
        failed: 0,
        refunded: 0
      }
    };
    
    // Process bills
    bills.forEach(bill => {
      // Add to total amount
      reportData.totalAmount += bill.total;
      
      // Count payment methods
      reportData.paymentMethods[bill.paymentMethod] += 1;
      
      // Count payment statuses
      reportData.paymentStatus[bill.paymentStatus] += 1;
      
      // Process services
      bill.services.forEach(service => {
        const serviceCategory = service.service?.category || 'other';
        
        // Skip if category filter is applied and doesn't match
        if (category && serviceCategory !== category) {
          return;
        }
        
        const serviceName = service.name;
        
        if (!reportData.services[serviceName]) {
          reportData.services[serviceName] = {
            count: 0,
            total: 0,
            category: serviceCategory
          };
        }
        
        reportData.services[serviceName].count += service.quantity;
        reportData.services[serviceName].total += service.price * service.quantity;
      });
      
      // Process products
      bill.products.forEach(product => {
        const productCategory = product.product?.category || 'other';
        
        // Skip if category filter is applied and doesn't match
        if (category && productCategory !== category) {
          return;
        }
        
        const productName = product.name;
        
        if (!reportData.products[productName]) {
          reportData.products[productName] = {
            quantity: 0,
            total: 0,
            category: productCategory
          };
        }
        
        reportData.products[productName].quantity += product.quantity;
        reportData.products[productName].total += product.price * product.quantity;
      });
    });
    
    // Calculate service and product totals
    reportData.servicesTotal = Object.values(reportData.services).reduce((sum, service) => sum + service.total, 0);
    reportData.productsTotal = Object.values(reportData.products).reduce((sum, product) => sum + product.total, 0);
    
    // Format as arrays for easier consumption by frontend
    reportData.servicesArray = Object.entries(reportData.services).map(([name, data]) => ({
      name,
      count: data.count,
      total: data.total,
      category: data.category
    }));
    
    reportData.productsArray = Object.entries(reportData.products).map(([name, data]) => ({
      name,
      quantity: data.quantity,
      total: data.total,
      category: data.category
    }));
    
    // Return JSON if format is not specified or is 'json'
    if (!req.query.format || req.query.format === 'json') {
      return res.json(reportData);
    }
    
    // Generate PDF if format is 'pdf'
    if (req.query.format === 'pdf') {
      // Create a PDF document
      const doc = new PDFDocument({ margin: 50 });
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=daily-report-${reportDate.toISOString().split('T')[0]}.pdf`);
      
      // Pipe the PDF to the response
      doc.pipe(res);
      
      // Add content to the PDF
      // Header
      doc.fontSize(20).text('Service Station', { align: 'center' });
      doc.fontSize(16).text('Daily Sales Report', { align: 'center' });
      doc.fontSize(12).text(`Date: ${reportDate.toLocaleDateString()}`, { align: 'center' });
      doc.moveDown();
      
      // Summary
      doc.fontSize(14).text('Summary', { underline: true });
      doc.fontSize(12);
      doc.text(`Total Bills: ${reportData.totalBills}`);
      doc.text(`Total Amount: $${reportData.totalAmount.toFixed(2)}`);
      doc.text(`Services Total: $${reportData.servicesTotal.toFixed(2)}`);
      doc.text(`Products Total: $${reportData.productsTotal.toFixed(2)}`);
      doc.moveDown();
      
      // Payment Methods
      doc.fontSize(14).text('Payment Methods', { underline: true });
      doc.fontSize(12);
      Object.entries(reportData.paymentMethods).forEach(([method, count]) => {
        if (count > 0) {
          doc.text(`${method.charAt(0).toUpperCase() + method.slice(1)}: ${count}`);
        }
      });
      doc.moveDown();
      
      // Payment Status
      doc.fontSize(14).text('Payment Status', { underline: true });
      doc.fontSize(12);
      Object.entries(reportData.paymentStatus).forEach(([status, count]) => {
        if (count > 0) {
          doc.text(`${status.charAt(0).toUpperCase() + status.slice(1)}: ${count}`);
        }
      });
      doc.moveDown();
      
      // Services
      if (reportData.servicesArray.length > 0) {
        doc.fontSize(14).text('Services', { underline: true });
        
        // Table header
        doc.fontSize(12);
        const servicesTableTop = doc.y;
        doc.text('Service', 50, servicesTableTop);
        doc.text('Category', 200, servicesTableTop);
        doc.text('Count', 300, servicesTableTop, { width: 50, align: 'center' });
        doc.text('Total', 450, servicesTableTop, { width: 100, align: 'right' });
        
        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
        doc.moveDown();
        
        // Table rows
        reportData.servicesArray.forEach(service => {
          const y = doc.y;
          
          doc.text(service.name, 50, y);
          doc.text(service.category, 200, y);
          doc.text(service.count.toString(), 300, y, { width: 50, align: 'center' });
          doc.text(`$${service.total.toFixed(2)}`, 450, y, { width: 100, align: 'right' });
          
          doc.moveDown();
        });
        
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
        doc.text(`Services Total: $${reportData.servicesTotal.toFixed(2)}`, { align: 'right' });
        doc.moveDown();
      }
      
      // Products
      if (reportData.productsArray.length > 0) {
        doc.fontSize(14).text('Products', { underline: true });
        
        // Table header
        doc.fontSize(12);
        const productsTableTop = doc.y;
        doc.text('Product', 50, productsTableTop);
        doc.text('Category', 200, productsTableTop);
        doc.text('Qty', 300, productsTableTop, { width: 50, align: 'center' });
        doc.text('Total', 450, productsTableTop, { width: 100, align: 'right' });
        
        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
        doc.moveDown();
        
        // Table rows
        reportData.productsArray.forEach(product => {
          const y = doc.y;
          
          doc.text(product.name, 50, y);
          doc.text(product.category, 200, y);
          doc.text(product.quantity.toString(), 300, y, { width: 50, align: 'center' });
          doc.text(`$${product.total.toFixed(2)}`, 450, y, { width: 100, align: 'right' });
          
          doc.moveDown();
        });
        
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
        doc.text(`Products Total: $${reportData.productsTotal.toFixed(2)}`, { align: 'right' });
        doc.moveDown();
      }
      
      // Footer
      doc.fontSize(10).text(`Report generated on ${new Date().toLocaleString()}`, { align: 'center' });
      
      // Finalize the PDF
      doc.end();
      return;
    }
    
    // If format is not supported
    res.status(400).json({ message: 'Unsupported format. Supported formats: json, pdf' });
  } catch (error) {
    console.error('Generate daily report error:', error);
    res.status(500).json({ message: 'Server error during report generation' });
  }
};

/**
 * Generate sales analytics
 * @route GET /api/reports/analytics
 * @access Private (admin)
 */
exports.generateSalesAnalytics = async (req, res) => {
  try {
    // Initialize default response data in case of errors
    const defaultResponse = {
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      totalSales: 0,
      totalRevenue: 0,
      averageSale: 0,
      growthRate: 0,
      dailyRevenue: {},
      dailyRevenueArray: [],
      monthlyTrends: {},
      topServices: [],
      topProducts: [],
      paymentMethods: {
        cash: 0,
        card: 0,
        online: 0,
        other: 0
      },
      categoryBreakdown: {
        services: {},
        products: {}
      }
    };
    
    const { period, startDate, endDate } = req.query;
    
    // Set date range for the report
    let start, end;
    const now = new Date();
    
    if (startDate && endDate) {
      // Custom date range
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      // Predefined periods
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      
      switch (period) {
        case 'week':
          start = new Date(now);
          start.setDate(now.getDate() - 7);
          start.setHours(0, 0, 0, 0);
          break;
        case 'month':
          start = new Date(now);
          start.setMonth(now.getMonth() - 1);
          start.setHours(0, 0, 0, 0);
          break;
        case 'year':
          start = new Date(now);
          start.setFullYear(now.getFullYear() - 1);
          start.setHours(0, 0, 0, 0);
          break;
        default:
          // Default to last 30 days
          start = new Date(now);
          start.setDate(now.getDate() - 30);
          start.setHours(0, 0, 0, 0);
      }
    }
    
    // Get bills within date range
    let bills = [];
    try {
      bills = await Bill.find({
        createdAt: {
          $gte: start,
          $lte: end
        }
      }).sort({ createdAt: 1 });
    } catch (error) {
      console.error('Error fetching bills:', error);
      // Return default data instead of error
      defaultResponse.period.start = start;
      defaultResponse.period.end = end;
      return res.status(200).json(defaultResponse);
    }
    
    // Initialize report data with safe defaults
    const reportData = {
      period: {
        start,
        end
      },
      totalSales: bills.length,
      totalRevenue: 0,
      averageSale: 0,
      growthRate: 0,
      dailyRevenue: {},
      dailyRevenueArray: [],
      monthlyTrends: {},
      topServices: [],
      topProducts: [],
      paymentMethods: {
        cash: 0,
        card: 0,
        online: 0,
        other: 0
      },
      categoryBreakdown: {
        services: {},
        products: {}
      }
    };
    
    // Process bills
    bills.forEach(bill => {
      // Add to total revenue
      reportData.totalRevenue += bill.total;
      
      // Count payment methods
      reportData.paymentMethods[bill.paymentMethod] += 1;
      
      // Process services
      bill.services.forEach(service => {
        const serviceName = service.name;
        
        if (!reportData.topServices[serviceName]) {
          reportData.topServices[serviceName] = {
            count: 0,
            total: 0
          };
        }
        
        reportData.topServices[serviceName].count += service.quantity;
        reportData.topServices[serviceName].total += service.price * service.quantity;
      });
      
      // Process products
      bill.products.forEach(product => {
        const productName = product.name;
        
        if (!reportData.topProducts[productName]) {
          reportData.topProducts[productName] = {
            quantity: 0,
            total: 0
          };
        }
        
        reportData.topProducts[productName].quantity += product.quantity;
        reportData.topProducts[productName].total += product.price * product.quantity;
      });
    });
    
    // Calculate average sale
    reportData.averageSale = reportData.totalRevenue / reportData.totalSales;
    
    // Format top services and products as arrays for easier consumption by frontend
    reportData.topServices = Object.entries(reportData.topServices).map(([name, data]) => ({
      name,
      count: data.count,
      total: data.total
    }));
    
    reportData.topProducts = Object.entries(reportData.topProducts).map(([name, data]) => ({
      name,
      quantity: data.quantity,
      total: data.total
    }));
    
    // Return the report data
    return res.status(200).json(reportData);
  } catch (error) {
    console.error('Error generating sales analytics:', error);
    // Return default data with proper structure instead of error
    return res.status(200).json({
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      totalSales: 0,
      totalRevenue: 0,
      averageSale: 0,
      growthRate: 0,
      dailyRevenue: {},
      dailyRevenueArray: [],
      monthlyTrends: {},
      topServices: [],
      topProducts: [],
      paymentMethods: {
        cash: 0,
        card: 0,
        online: 0,
        other: 0
      },
      categoryBreakdown: {
        services: {},
        products: {}
      }
    });
  }
};

/**
 * Generate inventory report
 * @route GET /api/reports/inventory
 * @access Private (admin, inventory_manager)
 */
exports.generateInventoryReport = async (req, res) => {
  try {
    // Initialize default response data in case of errors
    const defaultResponse = {
      totalProducts: 0,
      totalValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      categories: [],
      products: [],
      filteredCount: 0,
      filteredValue: 0
    };
    
    const { category, lowStock, sort } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by category if provided
    if (category) {
      query.category = category;
    }
    
    // Filter by low stock if provided
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantityInStock', '$lowStockThreshold'] };
    }
    
    // Build sort options
    let sortOptions = { name: 1 }; // Default sort by name
    if (sort) {
      const [field, order] = sort.split(':');
      sortOptions = { [field]: order === 'desc' ? -1 : 1 };
    }
    
    // Get products
    let products = [];
    try {
      products = await Product.find(query).sort(sortOptions);
    } catch (error) {
      console.error('Error fetching products:', error);
      return res.status(200).json(defaultResponse); // Return empty data instead of error
    }
    
    // Initialize report data with safe defaults
    const reportData = {
      totalProducts: products.length,
      totalValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      categories: {},
      categoriesArray: [], // Pre-initialize for chart data
      filteredCount: products.length,
      filteredValue: 0,
      products: products.map(product => {
        // Set default values for any missing properties
        const quantityInStock = product.quantityInStock || 0;
        const lowStockThreshold = product.lowStockThreshold || 5;
        const price = product.price || 0;
        
        const isLowInStock = quantityInStock <= lowStockThreshold && quantityInStock > 0;
        const isOutOfStock = quantityInStock === 0;
        const value = price * quantityInStock;
        
        // Update counters
        if (isLowInStock) reportData.lowStockCount++;
        if (isOutOfStock) reportData.outOfStockCount++;
        reportData.totalValue += value;
        reportData.filteredValue += value;
        
        // Update category stats - safely handle undefined categories
        const category = product.category || 'uncategorized';
        if (!reportData.categories[category]) {
          reportData.categories[category] = {
            count: 0,
            value: 0,
            name: category
          };
        }
        reportData.categories[category].count++;
        reportData.categories[category].value += value;
        
        return {
          id: product._id || `temp-${Math.random().toString(36).substr(2, 9)}`,
          name: product.name || 'Unnamed Product',
          category: category,
          price: price,
          quantityInStock: quantityInStock,
          lowStockThreshold: lowStockThreshold,
          value: value,
          status: isOutOfStock ? 'out-of-stock' : (isLowInStock ? 'low-stock' : 'in-stock')
        };
      })
    };
    
    // Format categories as array for easier consumption by frontend
    reportData.categories = Object.keys(reportData.categories).map(key => ({
      name: key,
      count: reportData.categories[key].count,
      value: reportData.categories[key].value
    }));
    
    // Return the report data
    return res.status(200).json(reportData);
  } catch (error) {
    console.error('Error generating inventory report:', error);
    // Return empty data with default structure instead of error
    return res.status(200).json({
      totalProducts: 0,
      totalValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      categories: [],
      products: [],
      filteredCount: 0,
      filteredValue: 0
    });
  }
};
