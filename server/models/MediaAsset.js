const mongoose = require('mongoose');

const mediaAssetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  originalUrl: {
    type: String,
    required: true,
  },
  cdnUrl: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['processing', 'active', 'error'],
    default: 'processing',
  },
  compressionLevel: {
    type: String,
    enum: ['none', 'low', 'medium', 'high'],
    default: 'medium',
  },
  cacheControl: {
    type: String,
    default: 'public, max-age=31536000',
  },
  region: {
    type: String,
    default: 'auto',
  },
  metadata: {
    width: Number,
    height: Number,
    format: String,
    duration: Number,
    bitrate: Number,
    codec: String,
  },
  optimizationHistory: [{
    timestamp: Date,
    action: String,
    originalSize: Number,
    optimizedSize: Number,
    settings: mongoose.Schema.Types.Mixed,
  }],
  cacheStatus: {
    lastPurged: Date,
    edges: [{
      region: String,
      status: String,
      lastUpdated: Date,
    }],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

mediaAssetSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

mediaAssetSchema.methods.optimize = async function(settings) {
  const originalSize = this.size;
  // Optimization logic would go here
  this.optimizationHistory.push({
    timestamp: new Date(),
    action: 'optimize',
    originalSize,
    optimizedSize: this.size,
    settings,
  });
  return this.save();
};

mediaAssetSchema.methods.purgeCache = async function() {
  this.cacheStatus.lastPurged = new Date();
  this.cacheStatus.edges.forEach(edge => {
    edge.status = 'purging';
    edge.lastUpdated = new Date();
  });
  return this.save();
};

module.exports = mongoose.model('MediaAsset', mediaAssetSchema);