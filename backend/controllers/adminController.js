const User = require('../models/User');
const cloudinary = require('cloudinary').v2;

const { fn, col, Op } = require('sequelize');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');
const OrderItem = require('../models/OrderItem');

// --- 1. Lihat Daftar Pengajuan (Pending) ---
const getPendingCreators = async (req, res) => {
  try {
    const pendingUsers = await User.findAll({
      where: { creator_status: 'pending' },
      attributes: ['id', 'name', 'email', 'ktp_image', 'selfie_ktp_image', 'createdAt']
    });

    res.status(200).json(pendingUsers);
  } catch (error) {
    console.error('Error get pending creators:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

// --- 2. Terima atau Tolak Pengajuan ---
const verifyCreator = async (req, res) => {
  try {
    const userId = req.params.id;
    const { action } = req.body; 

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    if (user.creator_status !== 'pending') {
      return res.status(400).json({ message: 'User ini tidak sedang dalam masa pengajuan.' });
    }

    if (action === 'approve') {
      user.creator_status = 'approved';
    } 
    else if (action === 'reject') {
      user.creator_status = 'rejected';
      
      // --- LOGIKA HAPUS FOTO DARI CLOUDINARY ---
      // Fungsi bantuan untuk mengambil nama file dari Link URL Cloudinary
      const extractPublicId = (url) => {
        if (!url) return null;
        // Memotong URL: "https://.../folder/namafile.jpg" menjadi "folder/namafile"
        const parts = url.split('/');
        const folderAndFile = parts.slice(-2).join('/'); 
        return folderAndFile.split('.')[0]; 
      };

      const ktpPublicId = extractPublicId(user.ktp_image);
      const selfiePublicId = extractPublicId(user.selfie_ktp_image);

      // Perintahkan Cloudinary untuk menghapus file fisik tersebut
      if (ktpPublicId) await cloudinary.uploader.destroy(ktpPublicId);
      if (selfiePublicId) await cloudinary.uploader.destroy(selfiePublicId);

      // --- LOGIKA RESET DATABASE ---
      // Kosongkan kolom di database agar user bisa upload ulang nantinya
      user.ktp_image = null;
      user.selfie_ktp_image = null;
    } 
    else {
      return res.status(400).json({ message: 'Aksi tidak valid! Gunakan approve / reject.' });
    }

    await user.save();

    res.status(200).json({ 
      message: `Pengajuan kreator berhasil di-${action}!`,
      newStatus: user.creator_status 
    });

  } catch (error) {
    console.error('Error verify creator:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

const getTopProductsPerCategory = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [{
        model: Product,
        limit: 5, // Ambil 5 teratas saja
        order: [['sold_count', 'DESC']],
        attributes: ['id', 'name', 'sold_count', 'price']
      }]
    });
    res.json(categories);
  } catch (error) {
    console.error('Error getTopProductsPerCategory:', error);
    res.status(500).json({ message: "Gagal mengambil data produk terlaris" });
  }
};

const getDailyTransactions = async (req, res) => {
  try {
    const stats = await Order.findAll({
      attributes: [
        [fn('DATE', col('Order.createdAt')), 'date'],
        [fn('COUNT', col('Order.id')), 'total_transactions'],
        [fn('IFNULL', fn('SUM', col('Order.total_price')), 0), 'total_revenue']
      ],
      group: [fn('DATE', col('Order.createdAt'))],
      order: [[fn('DATE', col('Order.createdAt')), 'ASC']]
    });
    res.json(stats);
  } catch (error) {
    console.error('Error getDailyTransactions:', error);
    res.status(500).json({ message: "Gagal mengambil statistik harian" });
  }
};

const getTopCreators = async (req, res) => {
  try {
    const topCreators = await User.findAll({
      attributes: [
        'id', 'name',
        [fn('COUNT', fn('DISTINCT', col('products.id'))), 'total_products'],
        [fn('IFNULL', fn('SUM', col('products->orderItems.price')), 0), 'total_income']
      ],
      include: [{
        model: Product,
        as: 'products',
        attributes: [],
        required: false,
        include: [{
          model: OrderItem,
          as: 'orderItems',
          attributes: [],
          required: false
        }]
      }],
      group: ['User.id', 'User.name'],
      order: [[fn('IFNULL', fn('SUM', col('products->orderItems.price')), 0), 'DESC']],
      limit: 10,
      subQuery: false
    });
    res.json(topCreators);
  } catch (error) {
    console.error('Error getTopCreators:', error);
    res.status(500).json({ message: "Gagal mengambil data kreator terbaik" });
  }
};


const getSystemStats = async (req, res) => {
  try {
    const activeUsers = await User.count();
    const totalTransactions = await Order.count();
    
    // Hitung total pendapatan / donasi
    const totalRevenueResult = await Order.findAll({
      attributes: [[fn('SUM', col('total_price')), 'totalRevenue']],
      where: {
        status: {
          [Op.in]: ['completed', 'shipped', 'processing'] // anggap ini sebagai valid revenue
        }
      },
      raw: true,
    });
    const totalDonations = totalRevenueResult[0]?.totalRevenue || 0;

    res.json({
      activeUsers,
      totalDonations: `Rp ${Number(totalDonations).toLocaleString('id-ID')}`,
      totalTransactions,
    });
  } catch (error) {
    console.error('Error getSystemStats:', error);
    res.status(500).json({ message: "Gagal mengambil statistik sistem" });
  }
};

module.exports = { 
  getPendingCreators, 
  verifyCreator, 
  getTopProductsPerCategory, 
  getDailyTransactions, 
  getTopCreators,
  getSystemStats 
};
