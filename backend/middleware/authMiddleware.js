const jwt = require('jsonwebtoken');
const User = require('../models/User'); // 1. Import Model User untuk mengecek database

// Satpam 1: Memastikan yang akses sudah Login (Punya Token Valid)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Akses ditolak! Anda belum login.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    next(); 
  } catch (error) {
    return res.status(403).json({ message: 'Token tidak valid atau sudah kadaluarsa!' });
  }
};

// Satpam 2: Memastikan yang akses adalah seorang Admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); 
  } else {
    return res.status(403).json({ message: 'Akses ditolak! Fitur ini khusus Admin.' });
  }
};

// --- TAMBAHAN BARU: Satpam 3 (Khusus Kreator yang Disetujui) ---
const isApprovedCreator = async (req, res, next) => {
  try {
    // Kita cari data user terbaru langsung dari database
    const user = await User.findByPk(req.user.id);
    
    // Cek apakah status kreatornya 'approved'
    if (user && user.creator_status === 'approved') {
      next(); // Silakan lewat dan unggah produk
    } else {
      return res.status(403).json({ 
        message: 'Akses ditolak! Akun Anda belum disetujui sebagai Kreator oleh Admin.' 
      });
    }
  } catch (error) {
    console.error('Error cek status kreator:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  isApprovedCreator
};