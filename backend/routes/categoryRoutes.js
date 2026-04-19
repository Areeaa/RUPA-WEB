const express = require('express');
const router = express.Router();
const { getAllCategories } = require('../controllers/categoryController');

// Rute Publik (Tanpa Token): Mengambil daftar kategori
router.get('/', getAllCategories);

module.exports = router;