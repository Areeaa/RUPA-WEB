const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');

const Review = sequelize.define('Review', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  
  rating: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    validate: { min: 1, max: 5 } // Rating hanya boleh 1 sampai 5
  },
  
  comment: { 
    type: DataTypes.TEXT, 
    allowNull: true 
  },

  // Relasi
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' }
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Product, key: 'id' }
  },
  // Menyimpan ID Order agar kita tahu ulasan ini dari transaksi yang mana
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Order, key: 'id' }
  }
}, {
  tableName: 'reviews',
  timestamps: true,
});

// Definisi Relasi
Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews' });
Review.belongsTo(Product, { foreignKey: 'productId' });

User.hasMany(Review, { foreignKey: 'userId', as: 'user_reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'reviewer' });

Order.hasOne(Review, { foreignKey: 'orderId' });
Review.belongsTo(Order, { foreignKey: 'orderId' });

module.exports = Review;