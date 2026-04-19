const express = require('express');
const router = express.Router();
const { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct, getMyProducts, getProductsByUser } = require('../controllers/productController');
const { verifyToken, isApprovedCreator } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinaryConfig');


// Route untuk Mendapatkan Semua Produk
router.get('/', getAllProducts);

// Route untuk produk milik user yang sedang login (harus sebelum /:id)
router.get('/my-products', verifyToken, getMyProducts);

// Route untuk produk milik user tertentu (publik)
router.get('/user/:userId', getProductsByUser);

// Route untuk Mendapatkan Detail Produk berdasarkan ID
router.get('/:id', getProductById);

// Route untuk Tambah Produk untuk creator disetujui
router.post(
  '/', 
  verifyToken, 
  isApprovedCreator,
  upload.array('images', 10),
  createProduct
);

// Route untuk Update Produk (hanya untuk creator yang sama dengan produk tersebut)
router.put('/:id', verifyToken, isApprovedCreator, upload.array('images', 10), updateProduct);

// Route untuk Hapus Produk (hanya untuk creator yang sama dengan produk tersebut)
router.delete('/:id', verifyToken, isApprovedCreator, deleteProduct);

module.exports = router;