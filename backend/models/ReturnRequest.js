const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Product = require('./Product');

const ReturnRequest = sequelize.define('ReturnRequest', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  return_code: { type: DataTypes.STRING, allowNull: false, unique: true },
  reason: { type: DataTypes.STRING, allowNull: false },
  return_type: {
    type: DataTypes.ENUM('refund', 'replacement'),
    allowNull: false,
    defaultValue: 'refund',
  },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  description: { type: DataTypes.TEXT, allowNull: false },
  additional_notes: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.ENUM('pending', 'in_review', 'approved', 'processing', 'completed', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
  video_evidence: { type: DataTypes.STRING, allowNull: true },
  photo_evidence: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  admin_notes: { type: DataTypes.TEXT, allowNull: true },
  rejection_reason: { type: DataTypes.TEXT, allowNull: true },
  refund_amount: { type: DataTypes.INTEGER, allowNull: true },
  reviewedAt: { type: DataTypes.DATE, allowNull: true },
  completedAt: { type: DataTypes.DATE, allowNull: true },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Order, key: 'id' },
  },
  orderItemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: OrderItem, key: 'id' },
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Product, key: 'id' },
  },
  buyerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' },
  },
  sellerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' },
  },
  reviewedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: User, key: 'id' },
  },
}, {
  tableName: 'return_requests',
  timestamps: true,
});

Order.hasMany(ReturnRequest, { foreignKey: 'orderId', as: 'returnRequests' });
ReturnRequest.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

OrderItem.hasMany(ReturnRequest, { foreignKey: 'orderItemId', as: 'returnRequests' });
ReturnRequest.belongsTo(OrderItem, { foreignKey: 'orderItemId', as: 'orderItem' });

Product.hasMany(ReturnRequest, { foreignKey: 'productId', as: 'returnRequests' });
ReturnRequest.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasMany(ReturnRequest, { foreignKey: 'buyerId', as: 'buyerReturnRequests' });
ReturnRequest.belongsTo(User, { foreignKey: 'buyerId', as: 'buyer' });

User.hasMany(ReturnRequest, { foreignKey: 'sellerId', as: 'sellerReturnRequests' });
ReturnRequest.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });

User.hasMany(ReturnRequest, { foreignKey: 'reviewedById', as: 'reviewedReturnRequests' });
ReturnRequest.belongsTo(User, { foreignKey: 'reviewedById', as: 'reviewer' });

module.exports = ReturnRequest;
