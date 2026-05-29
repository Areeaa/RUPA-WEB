const express = require('express');
const router = express.Router();
const { submitLicense, getMyLicenses, uploadLicensePayment } = require('../controllers/licenseController');
const { verifyToken } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinaryConfig');

// Wajib login untuk mengajukan dan melihat lisensi sendiri
router.post('/submit', verifyToken, submitLicense);
router.get('/my-licenses', verifyToken, getMyLicenses);

// Upload bukti pembayaran lisensi (user/pengaju)
router.put('/:id/payment', verifyToken, upload.single('payment_proof'), uploadLicensePayment);

module.exports = router;