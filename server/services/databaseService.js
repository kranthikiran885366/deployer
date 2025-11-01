// Database Service - Enhanced
const Database = require("../models/Database")

class DatabaseService {
  async createDatabase(projectId, data, createdBy) {
    const database = new Database({
      projectId,
      type: (data.type || "postgresql").toLowerCase(),
      name: data.name,
      displayName: data.displayName || data.name,
      size: data.size || "small",
      region: data.region || "iad1",
      host: data.host,
      port: data.port,
      database: data.database,
      username: data.username,
      password: data.password,
      connectionString: this._buildConnectionString(data.type, data),
      sslEnabled: data.sslEnabled || false,
      backupEnabled: data.backupEnabled !== false,
      backupSchedule: data.backupSchedule || "daily",
      isProvisioned: true,
      status: "creating",
      createdBy,
    })

    await database.save()

    // Simulate provisioning completion
    setTimeout(() => {
      Database.findByIdAndUpdate(database._id, { status: "running" })
    }, 5000)

    return database
  }

  async getDatabases(projectId) {
    return await Database.find({ projectId, isActive: true }).sort({ createdAt: -1 })
  }

  async getDatabaseById(id, projectId) {
    return await Database.findOne({
      _id: id,
      projectId,
      isActive: true,
    })
  }

  async updateDatabase(id, data) {
    return await Database.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
  }

  async deleteDatabase(id) {
    return await Database.findByIdAndUpdate(
      id,
      { isActive: false, status: "deleted" },
      { new: true }
    )
  }

  async executeQuery(databaseId, query) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    return {
      success: true,
      query,
      results: [],
      duration: 125,
    }
  }

  async getTableInfo(databaseId, tableName) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    return {
      table: tableName,
      columns: [],
      rowCount: 0,
      indexCount: 0,
      size: 0,
    }
  }

  async listTables(databaseId) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    return []
  }

  async createBackup(databaseId) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    const backup = {
      name: `backup-${databaseId}-${Date.now()}`,
      size: Math.floor(Math.random() * 1000),
      status: "pending",
      backupAt: new Date(),
      retentionDays: 30,
      isAutomatic: false,
    }

    database.backups.push(backup)
    await database.save()

    return backup
  }

  async listBackups(databaseId, { limit = 20, offset = 0 }) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    const backups = (database.backups || [])
      .sort((a, b) => new Date(b.backupAt) - new Date(a.backupAt))
      .slice(offset, offset + limit)

    return {
      backups,
      total: (database.backups || []).length,
      limit,
      offset,
    }
  }

  async restoreFromBackup(databaseId, backupName) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    const backup = (database.backups || []).find((b) => b.name === backupName)
    if (!backup) throw new Error("Backup not found")

    backup.status = "restoring"
    await database.save()

    setTimeout(() => {
      Database.findByIdAndUpdate(databaseId, {
        "backups.$[elem].status": "completed",
        "backups.$[elem].restoreAt": new Date(),
      })
    }, 3000)

    return backup
  }

  async scheduleAutomaticBackup(databaseId, schedule) {
    return await Database.findByIdAndUpdate(
      databaseId,
      { backupSchedule: schedule, backupEnabled: true },
      { new: true }
    )
  }

  async getBackupSize(databaseId, backupName) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    const backup = (database.backups || []).find((b) => b.name === backupName)
    if (!backup) throw new Error("Backup not found")

    return {
      backupName,
      size: backup.size,
      unit: "MB",
      createdAt: backup.backupAt,
    }
  }

  async deleteBackup(databaseId, backupName) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    database.backups = (database.backups || []).filter((b) => b.name !== backupName)
    await database.save()

    return { success: true, deletedId: backupName }
  }

  _buildConnectionString(type, config) {
    const dbType = (type || "postgresql").toLowerCase()
    switch (dbType) {
      case "postgresql":
        return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`
      case "mysql":
        return `mysql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`
      case "mongodb":
        return `mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`
      case "redis":
        return `redis://:${config.password}@${config.host}:${config.port}`
      default:
        return ""
    }
  }
}

module.exports = new DatabaseService()
