const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  
  // Total harga barang saja
  total_price: { type: DataTypes.INTEGER, allowNull: false },

  // --- TAMBAHAN UNTUK PRODUK FISIK ---
  shipping_cost: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    defaultValue: 0 
  },
  shipping_address: { 
    type: DataTypes.TEXT, 
    allowNull: true // Bisa diisi saat penjual buat tagihan di chat
  },
  tracking_number: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  // ----------------------------------
  
  status: {
    type: DataTypes.ENUM(
      'pending',              // Baru dibuat
      'waiting_verification', // Sudah upload bukti transfer
      'processing',           // Pembayaran sah, barang sedang disiapkan
      'shipped',              // Sudah diserahkan ke kurir (nanti)
      'completed',            // Diterima pembeli (nanti)
      'cancelled'             // Dibatalkan
    ),
    defaultValue: 'pending',
  },
  
  payment_proof: { type: DataTypes.STRING, allowNull: true },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' }
  },
  sellerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' }
  }
}, {
  tableName: 'orders',
  timestamps: true,
});

User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'buyer' });

module.exports = Order;