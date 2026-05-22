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
//    dengan transformasi otomatis untuk kompresi gambar
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');

    return {
      folder: 'figma_rupa_products',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'avi'],
      // Transformasi otomatis hanya untuk gambar (bukan video)
      ...(isVideo ? {} : {
        transformation: [
          {
            quality: 'auto:good',  // Kompresi otomatis kualitas baik (hemat ~40-60% ukuran)
            fetch_format: 'auto',  // Auto-konversi ke WebP/AVIF jika browser mendukung
            width: 1600,           // Maks lebar 1600px (cukup untuk layar besar)
            height: 1600,          // Maks tinggi 1600px
            crop: 'limit',         // Hanya resize jika gambar lebih besar, tidak paksakan
          },
        ],
      }),
    };
  },
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
