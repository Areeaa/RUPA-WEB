const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword, applyForCreator } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

// Import multer dari konfigurasi Cloudinary kita
const { upload } = require('../config/cloudinaryConfig');

// Route Lihat Profil (GET)
router.get('/profile', verifyToken, getProfile);

// Route Edit Profil (PUT)
// Menggunakan upload.single karena foto profil hanya ada 1
router.put('/profile', verifyToken, upload.single('profile_picture'), updateProfile);

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