const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword, applyForCreator, getPaymentInfo } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

// Import multer dari konfigurasi Cloudinary kita
const { upload } = require('../config/cloudinaryConfig');

// Route Lihat Profil (GET)
router.get('/profile', verifyToken, getProfile);

// Route Edit Profil (PUT)
// Menggunakan upload.fields agar bisa terima foto profil DAN gambar QRIS
router.put('/profile', verifyToken, upload.fields([
  { name: 'profile_picture', maxCount: 1 },
  { name: 'qris_image', maxCount: 1 }
]), updateProfile);

// Route Info Pembayaran (GET - Publik, tapi tetap perlu login)
router.get('/:id/payment-info', verifyToken, getPaymentInfo);

// Route Ganti Password (PUT)
router.put('/change-password', verifyToken, changePassword);

// Route Pengajuan Creator (POST)
router.post(
  '/apply-creator', 
  verifyToken, 
  upload.fields([
    { name: 'ktp_image', maxCount: 1 }, 
    { name: 'selfie_image', maxCount: 1 }
  ]), 
  applyForCreator
);

module.exports = router;