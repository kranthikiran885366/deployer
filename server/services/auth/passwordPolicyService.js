const bcrypt = require('bcryptjs');
const { PasswordPolicy } = require('../../models/auth/PasswordPolicy');
const { AuditLog } = require('../../models/AuditLog');

class PasswordPolicyService {
  async configurePolicy(organizationId, config) {
    const policy = await PasswordPolicy.findOneAndUpdate(
      { organizationId },
      config,
      { upsert: true, new: true }
    );

    await AuditLog.create({
      organizationId,
      action: 'password_policy_updated',
      details: {
        minLength: config.minLength,
        requireUppercase: config.requireUppercase,
        requireLowercase: config.requireLowercase,
        requireNumbers: config.requireNumbers,
        requireSpecialChars: config.requireSpecialChars,
        passwordHistory: config.passwordHistory,
        maxAge: config.maxAge,
        lockoutThreshold: config.lockoutThreshold,
        lockoutDuration: config.lockoutDuration,
        mfaRequired: config.mfaRequired
      },
      timestamp: new Date()
    });

    return policy;
  }

  async getPolicy(organizationId) {
    return await PasswordPolicy.findOne({ organizationId });
  }

  async validatePassword(organizationId, password, passwordHistory = []) {
    const policy = await this.getPolicy(organizationId);
    if (!policy) {
      throw new Error('Password policy not configured');
    }

    const errors = [];

    // Check minimum length
    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`);
    }

    // Check character requirements
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (policy.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check password history
    if (policy.passwordHistory > 0) {
      const recentPasswords = passwordHistory.slice(-policy.passwordHistory);
      for (const oldHash of recentPasswords) {
        const matches = await bcrypt.compare(password, oldHash);
        if (matches) {
          errors.push(`Password cannot be the same as your last ${policy.passwordHistory} passwords`);
          break;
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('. '));
    }

    return true;
  }

  async checkPasswordAge(organizationId, passwordLastChanged) {
    const policy = await this.getPolicy(organizationId);
    if (!policy || !policy.maxAge) {
      return { expired: false };
    }

    const now = new Date();
    const lastChanged = new Date(passwordLastChanged);
    const ageInDays = (now - lastChanged) / (1000 * 60 * 60 * 24);

    return {
      expired: ageInDays > policy.maxAge,
      daysUntilExpiry: Math.max(0, policy.maxAge - ageInDays),
      maxAge: policy.maxAge
    };
  }

  async recordFailedAttempt(userId) {
    // In production, this would be stored in a database or cache
    // This is a simplified example using memory
    this.failedAttempts = this.failedAttempts || new Map();
    
    const attempts = this.failedAttempts.get(userId) || {
      count: 0,
      firstAttempt: new Date()
    };

    attempts.count++;
    this.failedAttempts.set(userId, attempts);

    return attempts;
  }

  async checkLockout(organizationId, userId) {
    const policy = await this.getPolicy(organizationId);
    if (!policy || !policy.lockoutThreshold) {
      return { locked: false };
    }

    const attempts = this.failedAttempts?.get(userId);
    if (!attempts) {
      return { locked: false };
    }

    const now = new Date();
    const minutesSinceFirst = (now - attempts.firstAttempt) / (1000 * 60);

    // Reset if lockout duration has passed
    if (minutesSinceFirst > policy.lockoutDuration) {
      this.failedAttempts.delete(userId);
      return { locked: false };
    }

    // Check if threshold is exceeded
    if (attempts.count >= policy.lockoutThreshold) {
      const minutesRemaining = Math.ceil(policy.lockoutDuration - minutesSinceFirst);
      return {
        locked: true,
        minutesRemaining,
        threshold: policy.lockoutThreshold
      };
    }

    return {
      locked: false,
      attempts: attempts.count,
      threshold: policy.lockoutThreshold
    };
  }

  async resetLockout(userId) {
    this.failedAttempts?.delete(userId);
  }

  generatePasswordRequirements(policy) {
    const requirements = [
      `Minimum length: ${policy.minLength} characters`
    ];

    if (policy.requireUppercase) {
      requirements.push('At least one uppercase letter');
    }
    if (policy.requireLowercase) {
      requirements.push('At least one lowercase letter');
    }
    if (policy.requireNumbers) {
      requirements.push('At least one number');
    }
    if (policy.requireSpecialChars) {
      requirements.push('At least one special character');
    }
    if (policy.maxAge) {
      requirements.push(`Must be changed every ${policy.maxAge} days`);
    }
    if (policy.passwordHistory) {
      requirements.push(`Cannot reuse last ${policy.passwordHistory} passwords`);
    }
    if (policy.mfaRequired) {
      requirements.push('Multi-factor authentication required');
    }

    return requirements;
  }
}

module.exports = new PasswordPolicyService();