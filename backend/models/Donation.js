const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Donation = sequelize.define('Donation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1000 },
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'distributed', 'rejected'),
    defaultValue: 'pending',
  },
  adminNote: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  donorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' },
  },
  creatorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' },
  },
  reviewedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: User, key: 'id' },
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  distributedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  payment_proof: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  payment_proof_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'donations',
  timestamps: true,
});

User.hasMany(Donation, { foreignKey: 'donorId', as: 'donationsMade' });
Donation.belongsTo(User, { foreignKey: 'donorId', as: 'donor' });

User.hasMany(Donation, { foreignKey: 'creatorId', as: 'receivedDonations' });
Donation.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

User.hasMany(Donation, { foreignKey: 'reviewedById', as: 'reviewedDonations' });
Donation.belongsTo(User, { foreignKey: 'reviewedById', as: 'reviewer' });

module.exports = Donation;
