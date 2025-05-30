const express = require('express');
const { body } = require('express-validator');
const billController = require('../controllers/bill.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all bills
router.get('/', authenticate, billController.getAllBills);

// Get bill by ID
router.get('/:id', authenticate, billController.getBillById);

// Create a new bill - with minimal validation to allow various data formats
router.post(
  '/',
  [
    // Make authentication optional to allow demo mode
    (req, res, next) => {
      try {
        authenticate(req, res, next);
      } catch (error) {
        // If authentication fails, continue anyway but mark as unauthenticated
        req.isUnauthenticated = true;
        next();
      }
    },
    // Basic validation only
    body('discount', 'Discount must be a non-negative number').optional().isFloat({ min: 0 }),
    body('paymentMethod', 'Payment method must be valid').optional()
  ],
  billController.createBill
);

// Update bill payment status
router.patch(
  '/:id/payment',
  [
    authenticate,
    authorize(['admin', 'cashier']),
    body('paymentStatus', 'Payment status must be valid').optional().isIn(['pending', 'completed', 'failed', 'refunded']),
    body('paymentMethod', 'Payment method must be valid').optional().isIn(['cash', 'card', 'online', 'other'])
  ],
  billController.updatePaymentStatus
);

// Generate bill PDF
router.get('/:id/pdf', authenticate, billController.generateBillPDF);

// Get service history by license plate
router.get('/vehicle/:licensePlate', authenticate, billController.getVehicleServiceHistory);

module.exports = router;
