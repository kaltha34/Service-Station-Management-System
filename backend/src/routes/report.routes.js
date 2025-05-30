const express = require('express');
const reportController = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Generate daily sales report - admin and staff only
router.get('/daily', [authenticate, authorize(['admin', 'staff'])], reportController.generateDailyReport);

// Generate inventory report - admin and inventory_manager only
router.get('/inventory', [authenticate, authorize(['admin', 'inventory_manager'])], reportController.generateInventoryReport);

// Generate sales analytics - admin only
router.get('/analytics', [authenticate, authorize(['admin'])], reportController.generateSalesAnalytics);

module.exports = router;
