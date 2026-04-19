const express = require('express');
const router = express.Router();
const { submitLicense, getMyLicenses } = require('../controllers/licenseController');
const { verifyToken } = require('../middleware/authMiddleware');

// Wajib login untuk mengajukan dan melihat lisensi sendiri
router.post('/submit', verifyToken, submitLicense);
router.get('/my-licenses', verifyToken, getMyLicenses);

module.exports = router;