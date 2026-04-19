const express = require("express");
const router = express.Router();
const { getPendingCreators, verifyCreator } = require("../controllers/adminController");
const { createCategory, updateCategory, deleteCategory } = require("../controllers/categoryController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const { getPendingLicenses, verifyLicense } = require('../controllers/licenseController');
const { 
  getSystemStats, 
  getDailyTransactions, 
  getTopCreators, 
  getTopProductsPerCategory 
} = require("../controllers/adminController");

// Terapkan satpam Admin ke semua rute di dalam file ini
router.use(verifyToken, isAdmin);

// GET: /api/admin/stats
router.get('/stats', getSystemStats);

// GET: /api/admin/analytics/daily
router.get('/analytics/daily', getDailyTransactions);

// GET: /api/admin/analytics/creators
router.get('/analytics/creators', getTopCreators);

// GET: /api/admin/analytics/products
router.get('/analytics/products', getTopProductsPerCategory);

// GET: /api/admin/creators/pending
router.get("/creators/pending", getPendingCreators);

// PUT: /api/admin/creators/verify/:id
router.put("/creators/verify/:id", verifyCreator);

// POST: /api/admin/categories
router.post("/categories", createCategory);

// PUT: /api/admin/categories/:id
router.put("/categories/:id", updateCategory);

// DELETE: /api/admin/categories/:id
router.delete("/categories/:id", deleteCategory);

// Rute Pengajuan Lisensi (Hanya Admin)
router.get('/licenses/pending', getPendingLicenses);
router.put('/licenses/verify/:id', verifyLicense);

module.exports = router;