const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Conversation = sequelize.define('Conversation', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  
  // Siapa pembelinya?
  buyerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' }
  },
  
  // Siapa penjualnya/kreatornya?
  sellerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' }
  }
}, { tableName: 'conversations', timestamps: true });

// Relasi (Satu ruang chat punya 2 partisipan)
User.hasMany(Conversation, { foreignKey: 'buyerId', as: 'buying_chats' });
Conversation.belongsTo(User, { foreignKey: 'buyerId', as: 'buyer' });

User.hasMany(Conversation, { foreignKey: 'sellerId', as: 'selling_chats' });
Conversation.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });

module.exports = Conversation;