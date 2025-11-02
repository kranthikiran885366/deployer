const mongoose = require('mongoose');

const mfaConfigSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: ['totp', 'sms', 'email', 'webauthn']
  },
  secret: {
    type: String,
    required: true
  },
  backupCodes: [{
    code: String,
    used: {
      type: Boolean,
      default: false
    }
  }],
  verified: {
    type: Boolean,
    default: false
  },
  enabled: {
    type: Boolean,
    default: false
  },
  lastUsed: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

mfaConfigSchema.index({ userId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('MFAConfig', mfaConfigSchema);