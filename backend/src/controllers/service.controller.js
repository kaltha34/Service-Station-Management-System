const { validationResult } = require('express-validator');
const Service = require('../models/service.model');

/**
 * Get all services
 * @route GET /api/services
 * @access Private
 */
exports.getAllServices = async (req, res) => {
  try {
    const { category, active, sort, search } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by category if provided
    if (category) {
      query.category = category;
    }
    
    // Filter by active status if provided
    if (active !== undefined) {
      query.isActive = active === 'true';
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
    
    const services = await Service.find(query)
      .sort(sortOptions)
      .populate('createdBy', 'name');
    
    res.json(services);
  } catch (error) {
    console.error('Get all services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get service by ID
 * @route GET /api/services/:id
 * @access Private
 */
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('createdBy', 'name');
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.json(service);
  } catch (error) {
    console.error('Get service by ID error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create a new service
 * @route POST /api/services
 * @access Private (admin, staff)
 */
exports.createService = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, description, price, duration, category } = req.body;
    
    // Check if service with same name already exists
    const existingService = await Service.findOne({ name });
    if (existingService) {
      return res.status(400).json({ message: 'Service with this name already exists' });
    }
    
    // Create new service
    const service = new Service({
      name,
      description,
      price,
      duration,
      category,
      createdBy: req.user.id
    });
    
    await service.save();
    
    res.status(201).json({
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Server error during service creation' });
  }
};

/**
 * Update a service
 * @route PUT /api/services/:id
 * @access Private (admin, staff)
 */
exports.updateService = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, description, price, duration, category, isActive } = req.body;
    
    // Find service by ID
    let service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Check if updating to a name that already exists (except for this service)
    if (name && name !== service.name) {
      const existingService = await Service.findOne({ name });
      if (existingService) {
        return res.status(400).json({ message: 'Service with this name already exists' });
      }
    }
    
    // Update service fields
    if (name) service.name = name;
    if (description !== undefined) service.description = description;
    if (price !== undefined) service.price = price;
    if (duration !== undefined) service.duration = duration;
    if (category) service.category = category;
    if (isActive !== undefined) service.isActive = isActive;
    
    await service.save();
    
    res.json({
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    console.error('Update service error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.status(500).json({ message: 'Server error during service update' });
  }
};

/**
 * Delete a service
 * @route DELETE /api/services/:id
 * @access Private (admin only)
 */
exports.deleteService = async (req, res) => {
  try {
    // Find service by ID
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    await service.deleteOne();
    
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.status(500).json({ message: 'Server error during service deletion' });
  }
};
