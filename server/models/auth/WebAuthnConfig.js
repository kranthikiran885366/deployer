const mongoose = require('mongoose');

const webAuthnConfigSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  credentialId: {
    type: String,
    required: true,
    unique: true
  },
  publicKey: {
    type: String,
    required: true
  },
  counter: {
    type: Number,
    default: 0
  },
  transports: [{
    type: String,
    enum: ['usb', 'nfc', 'ble', 'internal']
  }],
  deviceName: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
});

webAuthnConfigSchema.index({ userId: 1, credentialId: 1 }, { unique: true });

module.exports = mongoose.model('WebAuthnConfig', webAuthnConfigSchema);