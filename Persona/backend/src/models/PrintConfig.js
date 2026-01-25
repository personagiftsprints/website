const mongoose = require('mongoose');

const printConfigSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  type: { type: String, enum: ['general', 'views', 'models'], required: true },
  description: String,
  
  // For general type
  area: {
    id: String,
    name: String,
    max: Number,
    type: String,
    description: String,
    referenceImages: [String],
    defaultImage: String
  },
  
  // For views type
  views: {
    type: Map,
    of: {
      baseImage: String,
      areas: [{
        id: String,
        name: String,
        max: Number,
        references: [String]
      }]
    }
  },
  
  // For models type
  models: [{
    modelCode: { type: String, required: true },
    modelName: { type: String, required: true },
    view: {
      baseImage: String,
      areas: [{
        id: String,
        name: String,
        max: Number,
        references: [String]
      }]
    }
  }],
  
  // Common properties
  productTypes: [{ type: String }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
printConfigSchema.index({ slug: 1 });
printConfigSchema.index({ type: 1, isActive: 1 });
printConfigSchema.index({ productTypes: 1 });

module.exports = mongoose.model('PrintConfig', printConfigSchema);