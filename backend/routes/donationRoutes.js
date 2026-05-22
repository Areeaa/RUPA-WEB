const express = require('express');
const router = express.Router();
const { createDonation, uploadDonationProof, getMyDonations } = require('../controllers/donationController');
const { verifyToken } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinaryConfig');

// POST /api/donations — buat donasi baru
router.post('/', verifyToken, upload.single('payment_proof'), createDonation);

// GET /api/donations/my-donations — riwayat donasi user yang login
router.get('/my-donations', verifyToken, getMyDonations);

// PUT /api/donations/:id/proof — upload bukti pembayaran donasi
router.put('/:id/proof', verifyToken, upload.single('payment_proof'), uploadDonationProof);

module.exports = router;
