const { validationResult } = require('express-validator');
const Product = require('../models/product.model');
const InventoryTransaction = require('../models/inventory-transaction.model');

/**
 * Get all products
 * @route GET /api/products
 * @access Private
 */
exports.getAllProducts = async (req, res) => {
  try {
    const { category, inStock, lowStock, sort, search } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by category if provided
    if (category) {
      query.category = category;
    }
    
    // Filter by stock status if provided
    if (inStock === 'true') {
      query.quantityInStock = { $gt: 0 };
    } else if (inStock === 'false') {
      query.quantityInStock = { $lte: 0 };
    }
    
    // Filter by low stock if provided
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantityInStock', '$lowStockThreshold'] };
    }
    
    // Search by name if provided
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    // Build sort options
    let sortOptions = { name: 1 }; // Default sort by name
    if (sort) {
      const [field, order] = sort.split(':');
      sortOptions = { [field]: order === 'desc' ? -1 : 1 };
    }
    
    const products = await Product.find(query)
      .sort(sortOptions)
      .populate('createdBy', 'name');
    
    res.json(products);
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get product by ID
 * @route GET /api/products/:id
 * @access Private
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Get product by ID error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create a new product
 * @route POST /api/products
 * @access Private (admin, inventory_manager)
 */
exports.createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { 
      name, 
      description, 
      price, 
      category, 
      quantityInStock, 
      lowStockThreshold,
      unit,
      barcode
    } = req.body;
    
    // Check if product with same name already exists
    const existingProduct = await Product.findOne({ name });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product with this name already exists' });
    }
    
    // Create new product
    const product = new Product({
      name,
      description,
      price,
      category,
      quantityInStock: quantityInStock || 0,
      lowStockThreshold: lowStockThreshold || 5,
      unit: unit || 'piece',
      barcode,
      createdBy: req.user.id
    });
    
    await product.save();
    
    // Create inventory transaction if initial stock is provided
    if (quantityInStock && quantityInStock > 0) {
      const transaction = new InventoryTransaction({
        product: product._id,
        type: 'purchase',
        quantity: quantityInStock,
        previousStock: 0,
        newStock: quantityInStock,
        unitPrice: price,
        totalPrice: price * quantityInStock,
        reference: 'Initial stock',
        notes: 'Initial stock on product creation',
        performedBy: req.user.id
      });
      
      await transaction.save();
    }
    
    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error during product creation' });
  }
};

/**
 * Update a product
 * @route PUT /api/products/:id
 * @access Private (admin, inventory_manager)
 */
exports.updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { 
      name, 
      description, 
      price, 
      category, 
      lowStockThreshold,
      unit,
      barcode,
      isActive
    } = req.body;
    
    // Find product by ID
    let product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if updating to a name that already exists (except for this product)
    if (name && name !== product.name) {
      const existingProduct = await Product.findOne({ name });
      if (existingProduct) {
        return res.status(400).json({ message: 'Product with this name already exists' });
      }
    }
    
    // Update product fields
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (category) product.category = category;
    if (lowStockThreshold !== undefined) product.lowStockThreshold = lowStockThreshold;
    if (unit) product.unit = unit;
    if (barcode !== undefined) product.barcode = barcode;
    if (isActive !== undefined) product.isActive = isActive;
    
    await product.save();
    
    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(500).json({ message: 'Server error during product update' });
  }
};

/**
 * Update product stock
 * @route PATCH /api/products/:id/stock
 * @access Private (admin, inventory_manager)
 */
exports.updateStock = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { quantity, type, notes, unitPrice } = req.body;
    
    // Find product by ID
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const previousStock = product.quantityInStock;
    let newStock = previousStock;
    
    // Calculate new stock based on transaction type
    switch (type) {
      case 'purchase':
        newStock = previousStock + quantity;
        break;
      case 'adjustment':
        newStock = quantity; // Direct set to the new value
        break;
      case 'sale':
      case 'damaged':
        if (previousStock < quantity) {
          return res.status(400).json({ message: 'Insufficient stock' });
        }
        newStock = previousStock - quantity;
        break;
      case 'return':
        newStock = previousStock + quantity;
        break;
      default:
        return res.status(400).json({ message: 'Invalid transaction type' });
    }
    
    // Update product stock
    product.quantityInStock = newStock;
    await product.save();
    
    // Create inventory transaction
    const transaction = new InventoryTransaction({
      product: product._id,
      type,
      quantity: Math.abs(newStock - previousStock),
      previousStock,
      newStock,
      unitPrice: unitPrice || product.price,
      totalPrice: (unitPrice || product.price) * Math.abs(newStock - previousStock),
      notes,
      performedBy: req.user.id
    });
    
    await transaction.save();
    
    res.json({
      message: 'Stock updated successfully',
      product,
      transaction
    });
  } catch (error) {
    console.error('Update stock error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(500).json({ message: 'Server error during stock update' });
  }
};

/**
 * Delete a product
 * @route DELETE /api/products/:id
 * @access Private (admin only)
 */
exports.deleteProduct = async (req, res) => {
  try {
    // Find product by ID
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    await product.deleteOne();
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(500).json({ message: 'Server error during product deletion' });
  }
};

/**
 * Get product stock history
 * @route GET /api/products/:id/stock-history
 * @access Private
 */
exports.getStockHistory = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    // Build query
    const query = { product: req.params.id };
    
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
    
    // Filter by transaction type if provided
    if (type) {
      query.type = type;
    }
    
    // Check if product exists
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Get stock history
    const stockHistory = await InventoryTransaction.find(query)
      .sort({ createdAt: -1 })
      .populate('performedBy', 'name')
      .populate('referenceId');
    
    res.json(stockHistory);
  } catch (error) {
    console.error('Get stock history error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};
