const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// 1. Masukkan kunci rahasia dari .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Atur penyimpanan Multer agar langsung ke Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'figma_rupa_products', // Nama folder yang akan otomatis terbuat di Cloudinary Anda
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], // Format gambar yang diizinkan
    // transformation: [{ width: 800, height: 600, crop: 'limit' }] // Opsional: otomatis kompres/resize gambar
  },
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };