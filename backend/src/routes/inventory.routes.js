const express = require('express');
const { body } = require('express-validator');
const inventoryController = require('../controllers/inventory.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all inventory transactions
router.get('/transactions', authenticate, inventoryController.getAllTransactions);

// Get low stock products
router.get('/low-stock', authenticate, inventoryController.getLowStockProducts);

// Export inventory data to CSV
router.get('/export', [authenticate, authorize(['admin', 'inventory_manager'])], inventoryController.exportInventoryData);

module.exports = router;
