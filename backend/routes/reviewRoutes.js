// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const { createReview, getProductReviews } = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/authMiddleware');

// POST: Tambah ulasan (Wajib Login)
router.post('/', verifyToken, createReview);

// GET: Lihat ulasan produk (Publik)
router.get('/product/:productId', getProductReviews);

module.exports = router;