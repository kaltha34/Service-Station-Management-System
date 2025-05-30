const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all products
router.get('/', authenticate, productController.getAllProducts);

// Get product by ID
router.get('/:id', authenticate, productController.getProductById);

// Create a new product - admin and inventory_manager only
router.post(
  '/',
  [
    authenticate,
    authorize(['admin', 'inventory_manager']),
    body('name', 'Name is required').notEmpty(),
    body('price', 'Price is required and must be a positive number').isFloat({ min: 0 }),
    body('category', 'Category is required').isIn(['oil', 'filter', 'fluid', 'part', 'accessory', 'cleaning', 'other']),
    body('quantityInStock', 'Quantity must be a non-negative number').optional().isInt({ min: 0 }),
    body('lowStockThreshold', 'Low stock threshold must be a positive number').optional().isInt({ min: 1 }),
    body('unit', 'Unit must be valid if provided').optional().isIn(['piece', 'liter', 'kg', 'box', 'set'])
  ],
  productController.createProduct
);

// Update a product - admin and inventory_manager only
router.put(
  '/:id',
  [
    authenticate,
    authorize(['admin', 'inventory_manager']),
    body('name', 'Name must not be empty if provided').optional().notEmpty(),
    body('price', 'Price must be a positive number if provided').optional().isFloat({ min: 0 }),
    body('category', 'Category must be valid if provided').optional().isIn(['oil', 'filter', 'fluid', 'part', 'accessory', 'cleaning', 'other']),
    body('lowStockThreshold', 'Low stock threshold must be a positive number').optional().isInt({ min: 1 }),
    body('unit', 'Unit must be valid if provided').optional().isIn(['piece', 'liter', 'kg', 'box', 'set'])
  ],
  productController.updateProduct
);

// Update product stock - admin and inventory_manager only
router.patch(
  '/:id/stock',
  [
    authenticate,
    authorize(['admin', 'inventory_manager']),
    body('quantity', 'Quantity is required and must be a positive number').isFloat({ min: 0 }),
    body('type', 'Type is required').isIn(['purchase', 'sale', 'adjustment', 'return', 'damaged']),
    body('unitPrice', 'Unit price must be a positive number if provided').optional().isFloat({ min: 0 })
  ],
  productController.updateStock
);

// Get product stock history
router.get('/:id/stock-history', authenticate, productController.getStockHistory);

// Delete a product - admin only
router.delete('/:id', [authenticate, authorize(['admin'])], productController.deleteProduct);

module.exports = router;
