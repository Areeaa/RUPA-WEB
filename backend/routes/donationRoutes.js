const express = require('express');
const router = express.Router();
const { createDonation } = require('../controllers/donationController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, createDonation);

module.exports = router;
