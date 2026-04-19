const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Order = require('./Order');
const Product = require('./Product');

const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Order, key: 'id' }
  },
  
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Product, key: 'id' }
  },
  
  // Berapa banyak produk ini dibeli dalam 1 order
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  
  // Harga produk SAAT TRANSAKSI TERJADI (Sangat penting untuk analitik admin)
  price: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'order_items',
  timestamps: true,
});

// Definisi Relasi ke Order (Satu nota punya banyak rincian barang)
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

// Definisi Relasi ke Product (Satu produk bisa ada di banyak nota berbeda)
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

module.exports = OrderItem;