const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { MFAConfig } = require('../../models/auth/MFAConfig');
const { AuditLog } = require('../../models/AuditLog');
const { User } = require('../../models/User');

class MFAService {
  async setupTOTP(userId) {
    const secret = speakeasy.generateSecret({
      name: process.env.APP_NAME || 'CloudDeck'
    });

    const mfaConfig = new MFAConfig({
      userId,
      type: 'totp',
      secret: secret.base32,
      backupCodes: this.generateBackupCodes()
    });

    await mfaConfig.save();

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode,
      backupCodes: mfaConfig.backupCodes.map(bc => bc.code)
    };
  }

  async verifyTOTP(userId, token) {
    const config = await MFAConfig.findOne({ userId, type: 'totp' });
    if (!config) {
      throw new Error('TOTP not set up for user');
    }

    const verified = speakeasy.totp.verify({
      secret: config.secret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (!verified) {
      // Check if it's a backup code
      const backupCode = config.backupCodes.find(bc => !bc.used && bc.code === token);
      if (backupCode) {
        backupCode.used = true;
        await config.save();
        verified = true;
      }
    }

    if (verified && !config.verified) {
      config.verified = true;
      config.enabled = true;
      await config.save();
    }

    if (verified) {
      config.lastUsed = new Date();
      await config.save();

      await AuditLog.create({
        userId,
        action: 'mfa_verification_success',
        details: { type: 'totp' },
        timestamp: new Date()
      });
    }

    return verified;
  }

  async setupSMS(userId, phoneNumber) {
    const mfaConfig = new MFAConfig({
      userId,
      type: 'sms',
      secret: phoneNumber,
      backupCodes: this.generateBackupCodes()
    });

    await mfaConfig.save();

    // Send verification code
    const code = this.generateOTP();
    await this.sendSMS(phoneNumber, `Your verification code is: ${code}`);

    return {
      phoneNumber,
      backupCodes: mfaConfig.backupCodes.map(bc => bc.code)
    };
  }

  async verifySMS(userId, code) {
    const config = await MFAConfig.findOne({ userId, type: 'sms' });
    if (!config) {
      throw new Error('SMS MFA not set up for user');
    }

    // In production, validate against sent code
    // This is a simplified example
    const verified = code === '123456';

    if (verified && !config.verified) {
      config.verified = true;
      config.enabled = true;
      await config.save();
    }

    if (verified) {
      config.lastUsed = new Date();
      await config.save();

      await AuditLog.create({
        userId,
        action: 'mfa_verification_success',
        details: { type: 'sms' },
        timestamp: new Date()
      });
    }

    return verified;
  }

  async setupEmail(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const mfaConfig = new MFAConfig({
      userId,
      type: 'email',
      secret: user.email,
      backupCodes: this.generateBackupCodes()
    });

    await mfaConfig.save();

    // Send verification code
    const code = this.generateOTP();
    await this.sendEmail(user.email, 'MFA Verification Code', 
      `Your verification code is: ${code}`);

    return {
      email: user.email,
      backupCodes: mfaConfig.backupCodes.map(bc => bc.code)
    };
  }

  async verifyEmail(userId, code) {
    const config = await MFAConfig.findOne({ userId, type: 'email' });
    if (!config) {
      throw new Error('Email MFA not set up for user');
    }

    // In production, validate against sent code
    // This is a simplified example
    const verified = code === '123456';

    if (verified && !config.verified) {
      config.verified = true;
      config.enabled = true;
      await config.save();
    }

    if (verified) {
      config.lastUsed = new Date();
      await config.save();

      await AuditLog.create({
        userId,
        action: 'mfa_verification_success',
        details: { type: 'email' },
        timestamp: new Date()
      });
    }

    return verified;
  }

  async disableMFA(userId, type) {
    const result = await MFAConfig.deleteOne({ userId, type });
    
    if (result.deletedCount > 0) {
      await AuditLog.create({
        userId,
        action: 'mfa_disabled',
        details: { type },
        timestamp: new Date()
      });
      return true;
    }
    return false;
  }

  async getMFAStatus(userId) {
    const configs = await MFAConfig.find({ userId });
    return configs.map(config => ({
      type: config.type,
      enabled: config.enabled,
      verified: config.verified,
      lastUsed: config.lastUsed,
      createdAt: config.createdAt
    }));
  }

  async regenerateBackupCodes(userId, type) {
    const config = await MFAConfig.findOne({ userId, type });
    if (!config) {
      throw new Error(`${type} MFA not set up for user`);
    }

    config.backupCodes = this.generateBackupCodes();
    await config.save();

    await AuditLog.create({
      userId,
      action: 'mfa_backup_codes_regenerated',
      details: { type },
      timestamp: new Date()
    });

    return config.backupCodes.map(bc => bc.code);
  }

  // Helper methods
  generateBackupCodes(count = 10) {
    return Array(count).fill(0).map(() => ({
      code: this.generateRandomCode(),
      used: false
    }));
  }

  generateRandomCode(length = 8) {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return Array(length).fill(0)
      .map(() => chars[Math.floor(Math.random() * chars.length)])
      .join('');
  }

  generateOTP(length = 6) {
    return Array(length).fill(0)
      .map(() => Math.floor(Math.random() * 10))
      .join('');
  }

  // SMS and Email sending methods would be implemented here
  // These are placeholder methods
  async sendSMS(phoneNumber, message) {
    // Implement SMS sending logic
    console.log(`Sending SMS to ${phoneNumber}: ${message}`);
  }

  async sendEmail(email, subject, message) {
    // Implement email sending logic
    console.log(`Sending email to ${email}: ${subject} - ${message}`);
  }
}

module.exports = new MFAService();