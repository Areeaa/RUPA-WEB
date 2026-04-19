const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Conversation = require('./Conversation');
const User = require('./User');
const Product = require('./Product');

const Message = sequelize.define('Message', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  
  conversationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Conversation, key: 'id' }
  },
  
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' }
  },
  
  text: { type: DataTypes.TEXT, allowNull: true },

  // INI KUNCINYA: Jika pesan ini berasal dari klik "Hubungi Penjual", kita simpan ID produknya di sini
  productId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: Product, key: 'id' }
  },

  // Tipe pesan: teks biasa, permintaan beli, atau tagihan
  type: {
    type: DataTypes.ENUM('text', 'purchase_request', 'invoice'),
    defaultValue: 'text'
  }
}, { tableName: 'messages', timestamps: true });

// Relasi
Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId' });

User.hasMany(Message, { foreignKey: 'senderId' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

Product.hasMany(Message, { foreignKey: 'productId' });
Message.belongsTo(Product, { foreignKey: 'productId', as: 'product_info' });

module.exports = Message;