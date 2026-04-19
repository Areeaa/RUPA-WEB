// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  
  // --- TAMBAHAN BARU: Foto Profil ---
  profile_picture: {
    type: DataTypes.STRING,
    allowNull: true,
    // Anda bisa menaruh link gambar 'avatar kosong' default di sini nanti jika mau
    defaultValue: 'https://res.cloudinary.com/drsr72xr8/image/upload/v1776049484/dummy-profile-pic_g9nmvw.png' 
  },

  // data kyc untuk pengajuan creator
  ktp_image:{
    type: DataTypes.STRING,
    allowNull: true,
  },
  selfie_ktp_image:{
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
  },
  creator_status: {
    type: DataTypes.ENUM('none', 'pending', 'approved', 'rejected'),
    defaultValue: 'none',
  },
  
  // --- TAMBAHAN BARU: Pengaturan & Profil ---
  themeColor: { type: DataTypes.STRING, defaultValue: 'green' },
  language: { type: DataTypes.STRING, defaultValue: 'id' },
  fullName: { type: DataTypes.STRING, allowNull: true },
  phoneNumber: { type: DataTypes.STRING, allowNull: true },
  address: { type: DataTypes.STRING, allowNull: true },
  gender: { type: DataTypes.STRING, allowNull: true },
  age: { type: DataTypes.STRING, allowNull: true },

  resetPasswordToken: { type: DataTypes.STRING, allowNull: true },
  resetPasswordExpires: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;