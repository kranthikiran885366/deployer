const { Session } = require('../../models/Session');
const { AuditLog } = require('../../models/AuditLog');
const { User } = require('../../models/User');
const jwt = require('jsonwebtoken');
const ms = require('ms');

class SessionService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.sessionDuration = ms('24h'); // Default session duration
  }

  async createSession(userId, metadata = {}) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const session = new Session({
      userId,
      token: this.generateToken(userId),
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + this.sessionDuration)
    });

    await session.save();

    await AuditLog.create({
      userId,
      action: 'session_created',
      details: {
        sessionId: session._id,
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress
      },
      timestamp: new Date()
    });

    return session;
  }

  async validateSession(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      const session = await Session.findOne({
        token,
        userId: decoded.userId,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      if (!session) {
        throw new Error('Session not found or expired');
      }

      // Update last activity
      session.lastActivity = new Date();
      await session.save();

      return session;
    } catch (error) {
      throw new Error('Invalid or expired session');
    }
  }

  async refreshSession(token) {
    const session = await Session.findOne({ token, isActive: true });
    if (!session) {
      throw new Error('Session not found');
    }

    session.expiresAt = new Date(Date.now() + this.sessionDuration);
    session.lastActivity = new Date();
    session.token = this.generateToken(session.userId);
    await session.save();

    await AuditLog.create({
      userId: session.userId,
      action: 'session_refreshed',
      details: { sessionId: session._id },
      timestamp: new Date()
    });

    return session;
  }

  async endSession(token) {
    const session = await Session.findOne({ token });
    if (!session) {
      throw new Error('Session not found');
    }

    session.isActive = false;
    session.endedAt = new Date();
    await session.save();

    await AuditLog.create({
      userId: session.userId,
      action: 'session_ended',
      details: { sessionId: session._id },
      timestamp: new Date()
    });

    return true;
  }

  async endAllUserSessions(userId, exceptSessionId = null) {
    const query = { 
      userId, 
      isActive: true,
      _id: { $ne: exceptSessionId }
    };

    const sessions = await Session.find(query);
    for (const session of sessions) {
      session.isActive = false;
      session.endedAt = new Date();
      await session.save();

      await AuditLog.create({
        userId,
        action: 'session_ended',
        details: { sessionId: session._id, reason: 'bulk_logout' },
        timestamp: new Date()
      });
    }

    return sessions.length;
  }

  async getUserSessions(userId) {
    return await Session.find({
      userId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).sort({ lastActivity: -1 });
  }

  async cleanupExpiredSessions() {
    const result = await Session.updateMany(
      {
        isActive: true,
        expiresAt: { $lte: new Date() }
      },
      {
        $set: {
          isActive: false,
          endedAt: new Date()
        }
      }
    );

    return result.modifiedCount;
  }

  generateToken(userId) {
    return jwt.sign(
      { userId, timestamp: Date.now() },
      this.jwtSecret,
      { expiresIn: this.sessionDuration }
    );
  }

  async updateSessionSettings(settings) {
    if (settings.sessionDuration) {
      this.sessionDuration = ms(settings.sessionDuration);
    }

    return {
      sessionDuration: this.sessionDuration
    };
  }

  async getSessionInfo(token) {
    const session = await Session.findOne({ token, isActive: true })
      .populate('userId', 'email firstName lastName');

    if (!session) {
      throw new Error('Session not found');
    }

    return {
      id: session._id,
      user: session.userId,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      expiresAt: session.expiresAt
    };
  }
}

module.exports = new SessionService();