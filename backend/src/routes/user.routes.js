const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all users - admin only
router.get('/', [authenticate, authorize(['admin'])], userController.getAllUsers);

// Get user by ID - admin only
router.get('/:id', [authenticate, authorize(['admin'])], userController.getUserById);

// Update user - admin only
router.put(
  '/:id',
  [
    authenticate,
    authorize(['admin']),
    body('name', 'Name must not be empty if provided').optional().notEmpty(),
    body('email', 'Please include a valid email if provided').optional().isEmail(),
    body('role', 'Role must be valid if provided').optional().isIn(['admin', 'staff', 'inventory_manager', 'cashier']),
    body('password', 'Password must be at least 6 characters if provided').optional().isLength({ min: 6 })
  ],
  userController.updateUser
);

// Delete user - admin only
router.delete('/:id', [authenticate, authorize(['admin'])], userController.deleteUser);

module.exports = router;
