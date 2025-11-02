const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/postgres');

const SystemStatus = sequelize.define('SystemStatus', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  status: {
    type: DataTypes.ENUM('operational', 'degraded', 'maintenance', 'outage'),
    defaultValue: 'operational'
  },
  message: DataTypes.TEXT,
  services: DataTypes.JSONB
});

module.exports = SystemStatus;