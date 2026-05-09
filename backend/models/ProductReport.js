const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');

const ProductReport = sequelize.define('ProductReport', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  reason: {
    type: DataTypes.ENUM('fraud', 'counterfeit', 'inappropriate', 'copyright', 'other'),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'reviewed', 'resolved', 'rejected'),
    defaultValue: 'pending',
  },
  resolution: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  reporterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' },
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Product, key: 'id' },
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
}, {
  tableName: 'product_reports',
  timestamps: true,
});

Product.hasMany(ProductReport, { foreignKey: 'productId', as: 'reports' });
ProductReport.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasMany(ProductReport, { foreignKey: 'reporterId', as: 'submittedProductReports' });
ProductReport.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });

User.hasMany(ProductReport, { foreignKey: 'reviewedById', as: 'reviewedProductReports' });
ProductReport.belongsTo(User, { foreignKey: 'reviewedById', as: 'reviewer' });

module.exports = ProductReport;
