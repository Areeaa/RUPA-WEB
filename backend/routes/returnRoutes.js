const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinaryConfig');
const { createReturnRequest, getMyReturns } = require('../controllers/returnController');

const router = express.Router();

router.get('/my-returns', verifyToken, getMyReturns);
router.post(
  '/',
  verifyToken,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'photos', maxCount: 5 },
    { name: 'evidence', maxCount: 5 },
  ]),
  createReturnRequest
);

module.exports = router;
