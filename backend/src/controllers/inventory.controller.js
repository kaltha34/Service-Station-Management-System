const Product = require('../models/product.model');
const InventoryTransaction = require('../models/inventory-transaction.model');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

/**
 * Get all inventory transactions
 * @route GET /api/inventory/transactions
 * @access Private
 */
exports.getAllTransactions = async (req, res) => {
  try {
    const { 
      productId, 
      type, 
      startDate, 
      endDate, 
      sort 
    } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by product if provided
    if (productId) {
      query.product = productId;
    }
    
    // Filter by transaction type if provided
    if (type) {
      query.type = type;
    }
    
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
    
    // Build sort options
    let sortOptions = { createdAt: -1 }; // Default sort by creation date (newest first)
    if (sort) {
      const [field, order] = sort.split(':');
      sortOptions = { [field]: order === 'desc' ? -1 : 1 };
    }
    
    const transactions = await InventoryTransaction.find(query)
      .sort(sortOptions)
      .populate('product', 'name category')
      .populate('performedBy', 'name')
      .populate({
        path: 'referenceId',
        model: 'Bill',
        select: 'billNumber customer.name'
      });
    
    res.json(transactions);
  } catch (error) {
    console.error('Get all inventory transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get low stock products
 * @route GET /api/inventory/low-stock
 * @access Private
 */
exports.getLowStockProducts = async (req, res) => {
  try {
    const { category } = req.query;
    
    // Build query
    const query = {
      $expr: { $lte: ['$quantityInStock', '$lowStockThreshold'] }
    };
    
    // Filter by category if provided
    if (category) {
      query.category = category;
    }
    
    const lowStockProducts = await Product.find(query)
      .sort({ quantityInStock: 1 })
      .select('name category quantityInStock lowStockThreshold price');
    
    res.json(lowStockProducts);
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Export inventory data to CSV
 * @route GET /api/inventory/export
 * @access Private (admin, inventory_manager)
 */
exports.exportInventoryData = async (req, res) => {
  try {
    const { type } = req.query;
    
    // Default to products export if type not specified
    const exportType = type || 'products';
    
    if (exportType === 'products') {
      // Export products data
      const products = await Product.find()
        .sort({ category: 1, name: 1 })
        .select('name description category price quantityInStock lowStockThreshold unit barcode isActive createdAt');
      
      // Transform data for CSV
      const transformedProducts = products.map(product => ({
        Name: product.name,
        Description: product.description || '',
        Category: product.category,
        Price: product.price,
        'Quantity In Stock': product.quantityInStock,
        'Low Stock Threshold': product.lowStockThreshold,
        Unit: product.unit,
        Barcode: product.barcode || '',
        Status: product.isActive ? 'Active' : 'Inactive',
        'Created At': product.createdAt.toISOString().split('T')[0]
      }));
      
      // Generate CSV
      const fields = ['Name', 'Description', 'Category', 'Price', 'Quantity In Stock', 'Low Stock Threshold', 'Unit', 'Barcode', 'Status', 'Created At'];
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(transformedProducts);
      
      // Set response headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=products-${new Date().toISOString().split('T')[0]}.csv`);
      
      // Send CSV
      res.send(csv);
    } else if (exportType === 'transactions') {
      // Export transactions data
      const transactions = await InventoryTransaction.find()
        .sort({ createdAt: -1 })
        .populate('product', 'name category')
        .populate('performedBy', 'name');
      
      // Transform data for CSV
      const transformedTransactions = transactions.map(transaction => ({
        'Product Name': transaction.product ? transaction.product.name : 'Unknown',
        'Product Category': transaction.product ? transaction.product.category : 'Unknown',
        'Transaction Type': transaction.type,
        Quantity: transaction.quantity,
        'Previous Stock': transaction.previousStock,
        'New Stock': transaction.newStock,
        'Unit Price': transaction.unitPrice || 0,
        'Total Price': transaction.totalPrice || 0,
        Reference: transaction.reference || '',
        Notes: transaction.notes || '',
        'Performed By': transaction.performedBy ? transaction.performedBy.name : 'Unknown',
        'Transaction Date': transaction.createdAt.toISOString().split('T')[0],
        'Transaction Time': transaction.createdAt.toISOString().split('T')[1].split('.')[0]
      }));
      
      // Generate CSV
      const fields = ['Product Name', 'Product Category', 'Transaction Type', 'Quantity', 'Previous Stock', 'New Stock', 'Unit Price', 'Total Price', 'Reference', 'Notes', 'Performed By', 'Transaction Date', 'Transaction Time'];
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(transformedTransactions);
      
      // Set response headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=inventory-transactions-${new Date().toISOString().split('T')[0]}.csv`);
      
      // Send CSV
      res.send(csv);
    } else {
      res.status(400).json({ message: 'Invalid export type. Supported types: products, transactions' });
    }
  } catch (error) {
    console.error('Export inventory data error:', error);
    res.status(500).json({ message: 'Server error during data export' });
  }
};
