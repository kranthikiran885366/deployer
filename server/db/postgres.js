const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://localhost:5432/deployment_framework',
  {
    dialect: 'postgres',
    dialectOptions: process.env.NODE_ENV === 'production' 
      ? { ssl: { rejectUnauthorized: false } }
      : {},
    pool: {
      max: 20,
      idle: 30000,
      acquire: 60000,
    },
  }
);

module.exports = { sequelize };