const mongoose = require('mongoose');

const ldapConfigSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Organization'
  },
  enabled: {
    type: Boolean,
    default: false
  },
  serverUrl: {
    type: String,
    required: true
  },
  bindDN: {
    type: String,
    required: true
  },
  bindCredentials: {
    type: String,
    required: true
  },
  searchBase: {
    type: String,
    required: true
  },
  searchFilter: {
    type: String,
    default: '(uid={{username}})'
  },
  groupSearchBase: String,
  groupSearchFilter: String,
  tlsOptions: {
    rejectUnauthorized: {
      type: Boolean,
      default: true
    },
    ca: String,
    cert: String,
    key: String
  },
  attributeMappings: {
    username: {
      type: String,
      default: 'uid'
    },
    email: {
      type: String,
      default: 'mail'
    },
    firstName: {
      type: String,
      default: 'givenName'
    },
    lastName: {
      type: String,
      default: 'sn'
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

ldapConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('LDAPConfig', ldapConfigSchema);