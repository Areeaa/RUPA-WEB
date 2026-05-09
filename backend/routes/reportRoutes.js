const express = require('express');
const router = express.Router();
const { createProductReport } = require('../controllers/productReportController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/products/:productId', verifyToken, createProductReport);

module.exports = router;
