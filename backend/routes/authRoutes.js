const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword, googleLogin } = require('../controllers/authController');

// Route untuk mendaftar pengguna baru
router.post('/register', register);

// Route untuk login pengguna
router.post('/login', login);

// Route untuk mengajukan permintaan reset password
router.post('/forgot-password', forgotPassword);

// Route untuk mereset password menggunakan token
router.post('/reset-password/:token', resetPassword);

// Route untuk login dengan Google
router.post('/google-login', googleLogin);

module.exports = router;