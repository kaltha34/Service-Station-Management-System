const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['oil', 'filter', 'fluid', 'part', 'accessory', 'cleaning', 'other']
  },
  quantityInStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    required: true,
    default: 5,
    min: 1
  },
  unit: {
    type: String,
    required: true,
    default: 'piece',
    enum: ['piece', 'liter', 'kg', 'box', 'set']
  },
  barcode: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Add index for faster searches
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ quantityInStock: 1 });

// Virtual for checking if product is low in stock
productSchema.virtual('isLowInStock').get(function() {
  return this.quantityInStock <= this.lowStockThreshold;
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
