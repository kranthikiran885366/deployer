const mongoose = require('mongoose');

const samlConfigSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Organization'
  },
  enabled: {
    type: Boolean,
    default: false
  },
  entityId: {
    type: String,
    required: true
  },
  assertionConsumerServiceURL: {
    type: String,
    required: true
  },
  idpIssuer: {
    type: String,
    required: true
  },
  idpSsoUrl: {
    type: String,
    required: true
  },
  idpCert: {
    type: String,
    required: true
  },
  spPrivateKey: String,
  spCert: String,
  nameIdFormat: {
    type: String,
    default: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'
  },
  signatureAlgorithm: {
    type: String,
    default: 'sha256'
  },
  attributeMappings: {
    email: {
      type: String,
      default: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
    },
    firstName: {
      type: String,
      default: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'
    },
    lastName: {
      type: String,
      default: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'
    }
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

samlConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SAMLConfig', samlConfigSchema);