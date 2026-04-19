const express = require('express');
const router = express.Router();
const { createInvoiceFromChat, confirmPayment, verifyPayment, inputResi, completeOrder, getMyOrders, getReceivedOrders } = require('../controllers/orderController');
const { verifyToken, isApprovedCreator } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinaryConfig');

// Pesanan user sendiri
router.get('/my-orders', verifyToken, getMyOrders);

// Hanya kreator yang bisa membuat tagihan dan melihat pesanan masuk
router.post('/invoice', verifyToken, isApprovedCreator, createInvoiceFromChat);
router.get('/received-orders', verifyToken, isApprovedCreator, getReceivedOrders);

// Pembeli konfirmasi bayar
router.put('/confirm/:orderId', verifyToken, upload.single('payment_proof'), confirmPayment);

// Penjual verifikasi (Review)
router.put('/verify/:orderId', verifyToken, isApprovedCreator, verifyPayment);

// Penjual input nomor resi setelah barang dikirim
router.put('/ship/:orderId', verifyToken, isApprovedCreator, inputResi);

// PUT /api/orders/complete/:orderId
router.put('/complete/:orderId', verifyToken, completeOrder);

module.exports = router;