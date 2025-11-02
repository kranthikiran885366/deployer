const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const webAuthnService = require('../../services/auth/webAuthnService');
const mfaService = require('../../services/auth/mfaService');
const passwordPolicyService = require('../../services/auth/passwordPolicyService');

// WebAuthn Routes
router.post('/webauthn/register/options', authMiddleware, async (req, res) => {
  try {
    const { username, displayName } = req.user;
    const options = await webAuthnService.generateRegistrationOptions(
      req.user.id,
      username,
      displayName
    );
    res.json(options);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/webauthn/register/verify', authMiddleware, async (req, res) => {
  try {
    const credential = await webAuthnService.verifyRegistration(
      req.user.id,
      req.body.credential
    );
    res.json(credential);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/webauthn/authenticate/options', authMiddleware, async (req, res) => {
  try {
    const options = await webAuthnService.generateAuthenticationOptions(req.user.id);
    res.json(options);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/webauthn/authenticate/verify', authMiddleware, async (req, res) => {
  try {
    const result = await webAuthnService.verifyAuthentication(
      req.user.id,
      req.body.assertion
    );
    res.json({ success: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/webauthn/devices', authMiddleware, async (req, res) => {
  try {
    const devices = await webAuthnService.listDevices(req.user.id);
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/webauthn/devices/:credentialId', authMiddleware, async (req, res) => {
  try {
    const success = await webAuthnService.removeDevice(
      req.user.id,
      req.params.credentialId
    );
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MFA Routes
router.post('/mfa/totp/setup', authMiddleware, async (req, res) => {
  try {
    const setup = await mfaService.setupTOTP(req.user.id);
    res.json(setup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/mfa/totp/verify', authMiddleware, async (req, res) => {
  try {
    const verified = await mfaService.verifyTOTP(req.user.id, req.body.token);
    res.json({ verified });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/mfa/sms/setup', authMiddleware, async (req, res) => {
  try {
    const setup = await mfaService.setupSMS(req.user.id, req.body.phoneNumber);
    res.json(setup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/mfa/sms/verify', authMiddleware, async (req, res) => {
  try {
    const verified = await mfaService.verifySMS(req.user.id, req.body.code);
    res.json({ verified });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/mfa/email/setup', authMiddleware, async (req, res) => {
  try {
    const setup = await mfaService.setupEmail(req.user.id);
    res.json(setup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/mfa/email/verify', authMiddleware, async (req, res) => {
  try {
    const verified = await mfaService.verifyEmail(req.user.id, req.body.code);
    res.json({ verified });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/mfa/:type', authMiddleware, async (req, res) => {
  try {
    const success = await mfaService.disableMFA(req.user.id, req.params.type);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/mfa/status', authMiddleware, async (req, res) => {
  try {
    const status = await mfaService.getMFAStatus(req.user.id);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/mfa/:type/backup-codes', authMiddleware, async (req, res) => {
  try {
    const codes = await mfaService.regenerateBackupCodes(req.user.id, req.params.type);
    res.json({ codes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Password Policy Routes
router.post('/password-policy', authMiddleware, async (req, res) => {
  try {
    const policy = await passwordPolicyService.configurePolicy(
      req.user.organizationId,
      req.body
    );
    res.json(policy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/password-policy', authMiddleware, async (req, res) => {
  try {
    const policy = await passwordPolicyService.getPolicy(req.user.organizationId);
    res.json(policy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/password-policy/validate', authMiddleware, async (req, res) => {
  try {
    const result = await passwordPolicyService.validatePassword(
      req.user.organizationId,
      req.body.password,
      req.body.passwordHistory
    );
    res.json({ valid: result });
  } catch (error) {
    res.status(400).json({
      valid: false,
      errors: error.message.split('. ')
    });
  }
});

router.get('/password-policy/age', authMiddleware, async (req, res) => {
  try {
    const status = await passwordPolicyService.checkPasswordAge(
      req.user.organizationId,
      req.user.passwordLastChanged
    );
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/password-policy/requirements', authMiddleware, async (req, res) => {
  try {
    const policy = await passwordPolicyService.getPolicy(req.user.organizationId);
    const requirements = passwordPolicyService.generatePasswordRequirements(policy);
    res.json({ requirements });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;