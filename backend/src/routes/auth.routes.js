const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Register a new user - admin only
router.post(
  '/register',
  [
    authenticate,
    authorize(['admin']),
    body('name', 'Name is required').notEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    body('role', 'Role must be valid').optional().isIn(['admin', 'staff', 'inventory_manager', 'cashier'])
  ],
  authController.register
);

// Login user
router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists()
  ],
  authController.login
);

// Get current user profile
router.get('/me', authenticate, authController.getCurrentUser);

// Update user profile
router.put(
  '/profile',
  [
    authenticate,
    body('name', 'Name is required').optional().notEmpty(),
    body('email', 'Please include a valid email').optional().isEmail(),
    body('currentPassword', 'Current password is required when updating password').optional(),
    body('newPassword', 'New password must be at least 6 characters').optional().isLength({ min: 6 })
  ],
  authController.updateProfile
);

module.exports = router;
