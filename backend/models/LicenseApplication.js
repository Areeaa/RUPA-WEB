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
    type: DataTypes.ENUM(
      'pending',                    // Baru diajukan, menunggu review admin
      'approved_pending_payment',   // Disetujui admin, menunggu pembayaran dari pengaju
      'waiting_verification',       // Bukti bayar sudah diupload, menunggu verifikasi admin
      'active',                     // Pembayaran terverifikasi, lisensi aktif
      'payment_rejected',           // Bukti bayar ditolak, harus upload ulang
      'rejected'                    // Ditolak oleh admin
    ),
    defaultValue: 'pending'
  },

  // === TAGIHAN DARI ADMIN ===
  admin_fee: {
    type: DataTypes.INTEGER,
    allowNull: true, // Diisi saat admin approve
  },
  admin_note: {
    type: DataTypes.TEXT,
    allowNull: true, // Catatan/instruksi dari admin
  },

  // === BUKTI PEMBAYARAN DARI PENGAJU ===
  payment_proof: {
    type: DataTypes.STRING,
    allowNull: true, // Path file bukti bayar (Cloudinary URL)
  },
  payment_proof_at: {
    type: DataTypes.DATE,
    allowNull: true, // Kapan bukti bayar diupload
  },

  // === TRACKING ADMIN ===
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true, // Kapan admin approve pengajuan
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: User, key: 'id' }
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true, // Kapan pembayaran diverifikasi admin
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

User.hasMany(LicenseApplication, { foreignKey: 'approved_by', as: 'approvedLicenses' });
LicenseApplication.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

module.exports = LicenseApplication;