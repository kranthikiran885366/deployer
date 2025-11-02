const mongoose = require('mongoose');

const passwordPolicySchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Organization'
  },
  minLength: {
    type: Number,
    default: 8
  },
  requireUppercase: {
    type: Boolean,
    default: true
  },
  requireLowercase: {
    type: Boolean,
    default: true
  },
  requireNumbers: {
    type: Boolean,
    default: true
  },
  requireSpecialChars: {
    type: Boolean,
    default: true
  },
  passwordHistory: {
    type: Number,
    default: 3
  },
  maxAge: {
    type: Number,
    default: 90 // days
  },
  lockoutThreshold: {
    type: Number,
    default: 5
  },
  lockoutDuration: {
    type: Number,
    default: 15 // minutes
  },
  mfaRequired: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

passwordPolicySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PasswordPolicy', passwordPolicySchema);