const express = require('express');
const { body } = require('express-validator');
const serviceController = require('../controllers/service.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all services
router.get('/', authenticate, serviceController.getAllServices);

// Get service by ID
router.get('/:id', authenticate, serviceController.getServiceById);

// Create a new service - admin and staff only
router.post(
  '/',
  [
    authenticate,
    authorize(['admin', 'staff']),
    body('name', 'Name is required').notEmpty(),
    body('price', 'Price is required and must be a positive number').isFloat({ min: 0 }),
    body('category', 'Category is required').isIn(['wash', 'maintenance', 'repair', 'inspection', 'other'])
  ],
  serviceController.createService
);

// Update a service - admin and staff only
router.put(
  '/:id',
  [
    authenticate,
    authorize(['admin', 'staff']),
    body('name', 'Name must not be empty if provided').optional().notEmpty(),
    body('price', 'Price must be a positive number if provided').optional().isFloat({ min: 0 }),
    body('category', 'Category must be valid if provided').optional().isIn(['wash', 'maintenance', 'repair', 'inspection', 'other'])
  ],
  serviceController.updateService
);

// Delete a service - admin only
router.delete('/:id', [authenticate, authorize(['admin'])], serviceController.deleteService);

module.exports = router;
