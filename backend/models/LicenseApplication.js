// models/LicenseApplication.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User'); // Hanya berelasi dengan User pemohon

const LicenseApplication = sequelize.define('LicenseApplication', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  
  nama_karya: { type: DataTypes.STRING, allowNull: false },
  nama_pengaju: { type: DataTypes.STRING, allowNull: false },
  
  jenis_lisensi: {
    type: DataTypes.ENUM('pemerintah', 'komersil', 'non komersil', 'pendidikan'),
    allowNull: false
  },
  
  durasi: {
    type: DataTypes.ENUM('1thn', '3thn', '5thn', 'selamanya'),
    allowNull: false
  },
  
  tujuan: { type: DataTypes.TEXT, allowNull: false },
  deskripsi_karya: { type: DataTypes.TEXT, allowNull: false },
  
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending' // Admin akan mereview status ini
  },

  // Relasi ke User (Siapa yang mengajukan)
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' }
  }
}, {
  tableName: 'license_applications',
  timestamps: true, // Untuk mencatat tanggal pengajuan
});

// Definisi Relasi
User.hasMany(LicenseApplication, { foreignKey: 'userId', as: 'licenses' });
LicenseApplication.belongsTo(User, { foreignKey: 'userId', as: 'pemohon' });

module.exports = LicenseApplication;