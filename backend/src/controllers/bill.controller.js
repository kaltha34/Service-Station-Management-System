const { validationResult } = require('express-validator');
const Bill = require('../models/bill.model');
const Product = require('../models/product.model');
const Service = require('../models/service.model');
const InventoryTransaction = require('../models/inventory-transaction.model');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Get all bills
 * @route GET /api/bills
 * @access Private
 */
exports.getAllBills = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      paymentStatus, 
      paymentMethod, 
      licensePlate,
      customerName,
      sort 
    } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by date range if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    // Filter by payment status if provided
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    
    // Filter by payment method if provided
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }
    
    // Filter by license plate if provided
    if (licensePlate) {
      query['customer.vehicleInfo.licensePlate'] = { $regex: licensePlate, $options: 'i' };
    }
    
    // Filter by customer name if provided
    if (customerName) {
      query['customer.name'] = { $regex: customerName, $options: 'i' };
    }
    
    // Build sort options
    let sortOptions = { createdAt: -1 }; // Default sort by creation date (newest first)
    if (sort) {
      const [field, order] = sort.split(':');
      sortOptions = { [field]: order === 'desc' ? -1 : 1 };
    }
    
    const bills = await Bill.find(query)
      .sort(sortOptions)
      .populate('createdBy', 'name')
      .populate('services.service', 'name price')
      .populate('products.product', 'name price');
    
    res.json(bills);
  } catch (error) {
    console.error('Get all bills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get bill by ID
 * @route GET /api/bills/:id
 * @access Private
 */
exports.getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('services.service', 'name price')
      .populate('products.product', 'name price');
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    res.json(bill);
  } catch (error) {
    console.error('Get bill by ID error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create a new bill
 * @route POST /api/bills
 * @access Private
 */
exports.createBill = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { 
      customer,
      services,
      products,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod,
      paymentStatus = 'paid',
      notes,
      date,
      createdBy
    } = req.body;
    
    // Validate services
    const validatedServices = [];
    let servicesSubtotal = 0;
    
    if (services && services.length > 0) {
      for (const item of services) {
        // Allow using either service ID or direct service data
        let service;
        if (item.service) {
          try {
            service = await Service.findById(item.service);
            if (!service) {
              // If service not found but we have name and price, create a temporary service object
              if (item.name && item.price) {
                service = { name: item.name, price: item.price, isActive: true };
              } else {
                return res.status(400).json({ message: `Service with ID ${item.service} not found` });
              }
            }
          } catch (error) {
            // If invalid ID format but we have name and price, create a temporary service object
            if (item.name && item.price) {
              service = { name: item.name, price: item.price, isActive: true };
            } else {
              return res.status(400).json({ message: `Invalid service ID format` });
            }
          }
        } else if (item.name && item.price) {
          service = { name: item.name, price: item.price, isActive: true };
        } else {
          return res.status(400).json({ message: `Service information incomplete` });
        }
        
        if (!service.isActive) {
          return res.status(400).json({ message: `Service ${service.name} is not active` });
        }
        
        const quantity = item.quantity || 1;
        const price = item.price || service.price;
        const itemTotal = price * quantity;
        
        validatedServices.push({
          service: service._id || 'custom',
          name: service.name,
          quantity,
          price,
          total: itemTotal
        });
        
        servicesSubtotal += itemTotal;
      }
    }
    
    // Validate products
    const validatedProducts = [];
    let productsSubtotal = 0;
    
    if (products && products.length > 0) {
      for (const item of products) {
        // Allow using either product ID or direct product data
        let product;
        if (item.product) {
          try {
            product = await Product.findById(item.product);
            if (!product) {
              // If product not found but we have name and price, create a temporary product object
              if (item.name && item.price) {
                product = { 
                  name: item.name, 
                  price: item.price, 
                  quantityInStock: item.quantity || 1 
                };
              } else {
                return res.status(400).json({ message: `Product with ID ${item.product} not found` });
              }
            }
          } catch (error) {
            // If invalid ID format but we have name and price, create a temporary product object
            if (item.name && item.price) {
              product = { 
                name: item.name, 
                price: item.price, 
                quantityInStock: item.quantity || 1 
              };
            } else {
              return res.status(400).json({ message: `Invalid product ID format` });
            }
          }
        } else if (item.name && item.price) {
          product = { 
            name: item.name, 
            price: item.price, 
            quantityInStock: item.quantity || 1 
          };
        } else {
          return res.status(400).json({ message: `Product information incomplete` });
        }
        
        const quantity = item.quantity || 1;
        
        // Check if enough stock is available for real products (not temporary ones)
        if (product._id && product.quantityInStock < quantity) {
          return res.status(400).json({ 
            message: `Not enough stock for ${product.name}. Available: ${product.quantityInStock}` 
          });
        }
        
        const price = item.price || product.price;
        const itemTotal = price * quantity;
        
        validatedProducts.push({
          product: product._id || 'custom',
          name: product.name,
          quantity,
          price,
          total: itemTotal
        });
        
        productsSubtotal += itemTotal;
        
        // Update product stock for real products
        if (product._id) {
          product.quantityInStock -= quantity;
          await product.save();
          
          // Create inventory transaction
          await InventoryTransaction.create({
            product: product._id,
            type: 'out',
            quantity,
            reason: 'sale',
            billId: null, // Will update this after bill is created
            createdBy: req.user?.id || 'system'
          });
        }
      }
    }
    
    // Calculate totals
    const calculatedSubtotal = servicesSubtotal + productsSubtotal;
    const calculatedTax = calculatedSubtotal * 0.18; // Default tax rate if not provided
    const calculatedTotal = calculatedSubtotal + calculatedTax - (discount || 0);
    
    // Create new bill
    const bill = new Bill({
      customer,
      services: validatedServices,
      products: validatedProducts,
      subtotal: subtotal || calculatedSubtotal,
      tax: tax || calculatedTax,
      taxRate: tax ? (tax / calculatedSubtotal) : 0.18,
      discount: discount || 0,
      total: total || calculatedTotal,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: paymentStatus || 'paid',
      notes,
      date: date || new Date(),
      createdBy: createdBy || req.user?.id || 'system'
    });
    
    await bill.save();
    
    // Update inventory transactions with bill ID
    if (validatedProducts.length > 0) {
      for (const item of validatedProducts) {
        const product = await Product.findById(item.product);
        const previousStock = product.quantityInStock;
        const newStock = previousStock - item.quantity;
        
        // Update product stock
        product.quantityInStock = newStock;
        await product.save();
        
        // Create inventory transaction
        const transaction = new InventoryTransaction({
          product: product._id,
          type: 'sale',
          quantity: item.quantity,
          previousStock,
          newStock,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          reference: `Bill #${bill.billNumber}`,
          referenceId: bill._id,
          referenceModel: 'Bill',
          notes: `Sale through bill #${bill.billNumber}`,
          performedBy: req.user.id
        });
        
        await transaction.save();
      }
    }
    
    res.status(201).json({
      message: 'Bill created successfully',
      bill
    });
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({ message: 'Server error during bill creation' });
  }
};

/**
 * Update bill payment status
 * @route PATCH /api/bills/:id/payment
 * @access Private
 */
exports.updatePaymentStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { paymentStatus, paymentMethod } = req.body;
    
    // Find bill by ID
    const bill = await Bill.findById(req.params.id);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Update payment status
    if (paymentStatus) bill.paymentStatus = paymentStatus;
    if (paymentMethod) bill.paymentMethod = paymentMethod;
    
    await bill.save();
    
    res.json({
      message: 'Payment status updated successfully',
      bill
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    res.status(500).json({ message: 'Server error during payment status update' });
  }
};

/**
 * Generate bill PDF
 * @route GET /api/bills/:id/pdf
 * @access Private
 */
exports.generateBillPDF = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('services.service', 'name')
      .populate('products.product', 'name');
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Create a PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bill-${bill.billNumber}.pdf`);
    
    // Pipe the PDF to the response
    doc.pipe(res);
    
    // Add content to the PDF
    // Header
    doc.fontSize(20).text('Service Station', { align: 'center' });
    doc.fontSize(14).text('Invoice', { align: 'center' });
    doc.moveDown();
    
    // Bill information
    doc.fontSize(12).text(`Bill Number: ${bill.billNumber}`);
    doc.text(`Date: ${bill.createdAt.toLocaleDateString()}`);
    doc.text(`Time: ${bill.createdAt.toLocaleTimeString()}`);
    doc.moveDown();
    
    // Customer information
    if (bill.customer && (bill.customer.name || bill.customer.vehicleInfo)) {
      doc.fontSize(14).text('Customer Information');
      if (bill.customer.name) doc.fontSize(12).text(`Name: ${bill.customer.name}`);
      if (bill.customer.phone) doc.text(`Phone: ${bill.customer.phone}`);
      if (bill.customer.vehicleInfo && bill.customer.vehicleInfo.licensePlate) {
        doc.text(`License Plate: ${bill.customer.vehicleInfo.licensePlate}`);
        if (bill.customer.vehicleInfo.make) doc.text(`Vehicle: ${bill.customer.vehicleInfo.make} ${bill.customer.vehicleInfo.model || ''} ${bill.customer.vehicleInfo.year || ''}`);
      }
      doc.moveDown();
    }
    
    // Services
    if (bill.services && bill.services.length > 0) {
      doc.fontSize(14).text('Services');
      
      // Table header
      doc.fontSize(12);
      const servicesTableTop = doc.y;
      doc.text('Service', 50, servicesTableTop);
      doc.text('Qty', 300, servicesTableTop, { width: 50, align: 'center' });
      doc.text('Price', 350, servicesTableTop, { width: 100, align: 'right' });
      doc.text('Total', 450, servicesTableTop, { width: 100, align: 'right' });
      
      doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
      doc.moveDown();
      
      // Table rows
      let servicesTotal = 0;
      bill.services.forEach((service, i) => {
        const y = doc.y;
        const serviceTotal = service.price * service.quantity;
        servicesTotal += serviceTotal;
        
        doc.text(service.name, 50, y);
        doc.text(service.quantity.toString(), 300, y, { width: 50, align: 'center' });
        doc.text(`$${service.price.toFixed(2)}`, 350, y, { width: 100, align: 'right' });
        doc.text(`$${serviceTotal.toFixed(2)}`, 450, y, { width: 100, align: 'right' });
        
        doc.moveDown();
      });
      
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
      doc.text(`Services Subtotal: $${servicesTotal.toFixed(2)}`, { align: 'right' });
      doc.moveDown();
    }
    
    // Products
    if (bill.products && bill.products.length > 0) {
      doc.fontSize(14).text('Products');
      
      // Table header
      doc.fontSize(12);
      const productsTableTop = doc.y;
      doc.text('Product', 50, productsTableTop);
      doc.text('Qty', 300, productsTableTop, { width: 50, align: 'center' });
      doc.text('Price', 350, productsTableTop, { width: 100, align: 'right' });
      doc.text('Total', 450, productsTableTop, { width: 100, align: 'right' });
      
      doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
      doc.moveDown();
      
      // Table rows
      let productsTotal = 0;
      bill.products.forEach((product, i) => {
        const y = doc.y;
        const productTotal = product.price * product.quantity;
        productsTotal += productTotal;
        
        doc.text(product.name, 50, y);
        doc.text(product.quantity.toString(), 300, y, { width: 50, align: 'center' });
        doc.text(`$${product.price.toFixed(2)}`, 350, y, { width: 100, align: 'right' });
        doc.text(`$${productTotal.toFixed(2)}`, 450, y, { width: 100, align: 'right' });
        
        doc.moveDown();
      });
      
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
      doc.text(`Products Subtotal: $${productsTotal.toFixed(2)}`, { align: 'right' });
      doc.moveDown();
    }
    
    // Totals
    doc.fontSize(14).text('Summary', { underline: true });
    doc.fontSize(12);
    doc.text(`Subtotal: $${bill.subtotal.toFixed(2)}`, { align: 'right' });
    doc.text(`Tax (${(bill.taxRate * 100).toFixed(0)}%): $${bill.taxAmount.toFixed(2)}`, { align: 'right' });
    if (bill.discount > 0) {
      doc.text(`Discount: $${bill.discount.toFixed(2)}`, { align: 'right' });
    }
    doc.fontSize(14).text(`Total: $${bill.total.toFixed(2)}`, { align: 'right' });
    doc.moveDown();
    
    // Payment information
    doc.fontSize(12).text(`Payment Method: ${bill.paymentMethod.charAt(0).toUpperCase() + bill.paymentMethod.slice(1)}`);
    doc.text(`Payment Status: ${bill.paymentStatus.charAt(0).toUpperCase() + bill.paymentStatus.slice(1)}`);
    
    // Footer
    doc.fontSize(10).text('Thank you for your business!', { align: 'center' });
    
    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error('Generate bill PDF error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    res.status(500).json({ message: 'Server error during PDF generation' });
  }
};

/**
 * Get service history by license plate
 * @route GET /api/bills/vehicle/:licensePlate
 * @access Private
 */
exports.getVehicleServiceHistory = async (req, res) => {
  try {
    const { licensePlate } = req.params;
    
    if (!licensePlate) {
      return res.status(400).json({ message: 'License plate is required' });
    }
    
    const bills = await Bill.find({
      'customer.vehicleInfo.licensePlate': { $regex: licensePlate, $options: 'i' }
    })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name')
      .populate('services.service', 'name category')
      .populate('products.product', 'name category');
    
    res.json(bills);
  } catch (error) {
    console.error('Get vehicle service history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
