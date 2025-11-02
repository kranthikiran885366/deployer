const { randomBytes } = require('crypto');
const { Fido2Lib } = require('fido2-lib');
const { WebAuthnConfig } = require('../../models/auth/WebAuthnConfig');
const { AuditLog } = require('../../models/AuditLog');

class WebAuthnService {
  constructor() {
    this.f2l = new Fido2Lib({
      timeout: 60000,
      rpId: process.env.WEBAUTHN_RP_ID || 'localhost',
      rpName: process.env.WEBAUTHN_RP_NAME || 'CloudDeck',
      challengeSize: 128,
      attestation: 'none',
      cryptoParams: [-7, -257],
      authenticatorAttachment: 'platform',
      authenticatorRequireResidentKey: false,
      authenticatorUserVerification: 'preferred'
    });
  }

  async generateRegistrationOptions(userId, username, displayName) {
    const registrationOptions = await this.f2l.attestationOptions();
    
    // Add user information
    registrationOptions.user = {
      id: Buffer.from(userId),
      name: username,
      displayName: displayName
    };

    // Save challenge for later verification
    const challenge = registrationOptions.challenge;
    await this.storeTemporaryChallenge(userId, challenge);

    return registrationOptions;
  }

  async verifyRegistration(userId, credential) {
    const expectedChallenge = await this.getStoredChallenge(userId);
    if (!expectedChallenge) {
      throw new Error('Registration challenge not found or expired');
    }

    const verification = await this.f2l.attestationResult(credential, {
      challenge: expectedChallenge,
      origin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000',
      factor: 'either'
    });

    const config = new WebAuthnConfig({
      userId,
      credentialId: credential.id,
      publicKey: verification.authnrData.get('credentialPublicKeyPem'),
      counter: verification.authnrData.get('counter'),
      transports: credential.transports,
      deviceName: credential.deviceName
    });

    await config.save();

    await AuditLog.create({
      userId,
      action: 'webauthn_device_registered',
      details: {
        credentialId: credential.id,
        deviceName: credential.deviceName
      },
      timestamp: new Date()
    });

    return config;
  }

  async generateAuthenticationOptions(userId) {
    const credentials = await WebAuthnConfig.find({ userId });
    if (!credentials.length) {
      throw new Error('No WebAuthn credentials found for user');
    }

    const authOptions = await this.f2l.assertionOptions();
    
    // Add allowed credentials
    authOptions.allowCredentials = credentials.map(cred => ({
      id: cred.credentialId,
      type: 'public-key',
      transports: cred.transports
    }));

    // Save challenge
    await this.storeTemporaryChallenge(userId, authOptions.challenge);

    return authOptions;
  }

  async verifyAuthentication(userId, assertion) {
    const credential = await WebAuthnConfig.findOne({
      userId,
      credentialId: assertion.id
    });

    if (!credential) {
      throw new Error('Unknown credential');
    }

    const expectedChallenge = await this.getStoredChallenge(userId);
    if (!expectedChallenge) {
      throw new Error('Authentication challenge not found or expired');
    }

    const verification = await this.f2l.assertionResult(assertion, {
      challenge: expectedChallenge,
      origin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000',
      factor: 'either',
      publicKey: credential.publicKey,
      prevCounter: credential.counter,
      userHandle: Buffer.from(userId)
    });

    // Update counter
    credential.counter = verification.authnrData.get('counter');
    credential.lastUsed = new Date();
    await credential.save();

    await AuditLog.create({
      userId,
      action: 'webauthn_authentication_success',
      details: {
        credentialId: credential.credentialId,
        deviceName: credential.deviceName
      },
      timestamp: new Date()
    });

    return true;
  }

  async listDevices(userId) {
    const credentials = await WebAuthnConfig.find({ userId });
    return credentials.map(cred => ({
      id: cred.credentialId,
      deviceName: cred.deviceName,
      lastUsed: cred.lastUsed,
      createdAt: cred.createdAt
    }));
  }

  async removeDevice(userId, credentialId) {
    const result = await WebAuthnConfig.deleteOne({
      userId,
      credentialId
    });

    if (result.deletedCount > 0) {
      await AuditLog.create({
        userId,
        action: 'webauthn_device_removed',
        details: { credentialId },
        timestamp: new Date()
      });
      return true;
    }
    return false;
  }

  // Challenge management methods
  async storeTemporaryChallenge(userId, challenge) {
    // In production, use Redis or similar for challenge storage
    // This is a simplified example
    this.challenges = this.challenges || new Map();
    this.challenges.set(userId, {
      challenge,
      timestamp: Date.now()
    });
  }

  async getStoredChallenge(userId) {
    const stored = this.challenges?.get(userId);
    if (!stored) return null;

    // Check if challenge is expired (5 minutes)
    if (Date.now() - stored.timestamp > 300000) {
      this.challenges.delete(userId);
      return null;
    }

    this.challenges.delete(userId);
    return stored.challenge;
  }
}

module.exports = new WebAuthnService();