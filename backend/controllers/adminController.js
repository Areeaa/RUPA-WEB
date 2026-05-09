const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const { fn, col, literal, Op } = require('sequelize');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');
const OrderItem = require('../models/OrderItem');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const getFrontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:5173';

const sendAdminPasswordEmail = async (user, mode = 'created') => {
  const token = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000;
  await user.save();

  const resetUrl = `${getFrontendUrl()}/reset-password/${token}`;
  const subject = mode === 'created'
    ? 'Akses Admin RUPA'
    : 'Reset Password Admin RUPA';
  const intro = mode === 'created'
    ? 'Akun admin RUPA Anda telah dibuat.'
    : 'Permintaan ganti password admin RUPA telah dibuat.';

  await transporter.sendMail({
    to: user.email,
    subject,
    text: `${intro}\n\nSilakan atur password melalui tautan berikut. Tautan berlaku selama 1 jam:\n\n${resetUrl}`,
  });
};

const getAdmins = async (req, res) => {
  try {
    const admins = await User.findAll({
      where: { role: 'admin' },
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(admins);
  } catch (error) {
    console.error('Error get admins:', error);
    res.status(500).json({ message: 'Gagal mengambil daftar admin' });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Nama dan email admin wajib diisi.' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar.' });
    }

    const randomPassword = crypto.randomBytes(24).toString('hex');
    const admin = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: await bcrypt.hash(randomPassword, 10),
      role: 'admin',
      creator_status: 'none',
    });

    await sendAdminPasswordEmail(admin, 'created');

    const safeAdmin = admin.toJSON();
    delete safeAdmin.password;
    delete safeAdmin.resetPasswordToken;
    delete safeAdmin.resetPasswordExpires;

    res.status(201).json({
      message: 'Admin berhasil dibuat. Email pengaturan password telah dikirim.',
      admin: safeAdmin,
    });
  } catch (error) {
    console.error('Error create admin:', error);
    res.status(500).json({ message: 'Gagal membuat admin atau mengirim email password.' });
  }
};

const sendAdminPasswordReset = async (req, res) => {
  try {
    const admin = await User.findOne({
      where: {
        id: req.params.id,
        role: 'admin',
      },
    });

    if (!admin) {
      return res.status(404).json({ message: 'Admin tidak ditemukan.' });
    }

    await sendAdminPasswordEmail(admin, 'reset');

    res.status(200).json({ message: 'Email ganti password admin berhasil dikirim.' });
  } catch (error) {
    console.error('Error send admin reset password:', error);
    res.status(500).json({ message: 'Gagal mengirim email ganti password admin.' });
  }
};

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
    const validOrderStatuses = ['completed', 'shipped', 'processing'];

    const categories = await Category.findAll({
      attributes: [
        'id',
        'name',
        [literal('IFNULL(SUM(`Products->orderItems`.`quantity`), 0)'), 'total_sales'],
        [literal('IFNULL(SUM(`Products->orderItems`.`price` * `Products->orderItems`.`quantity`), 0)'), 'total_revenue'],
        [fn('COUNT', fn('DISTINCT', col('Products.id'))), 'total_products']
      ],
      include: [{
        model: Product,
        attributes: [],
        required: true,
        include: [{
          model: OrderItem,
          as: 'orderItems',
          attributes: [],
          required: true,
          include: [{
            model: Order,
            attributes: [],
            required: true,
            where: {
              status: { [Op.in]: validOrderStatuses }
            }
          }]
        }]
      }],
      group: ['Category.id', 'Category.name'],
      order: [
        [literal('total_sales'), 'DESC'],
        [literal('total_revenue'), 'DESC']
      ],
      limit: 10,
      subQuery: false
    });

    const categoryRows = await Promise.all(categories.map(async (category) => {
      const plainCategory = category.get({ plain: true });

      const topProduct = await Product.findOne({
        where: { categoryId: plainCategory.id },
        attributes: [
          'id',
          'name',
          [literal('IFNULL(SUM(`orderItems`.`quantity`), 0)'), 'total_sales'],
          [literal('IFNULL(SUM(`orderItems`.`price` * `orderItems`.`quantity`), 0)'), 'total_revenue']
        ],
        include: [{
          model: OrderItem,
          as: 'orderItems',
          attributes: [],
          required: true,
          include: [{
            model: Order,
            attributes: [],
            required: true,
            where: {
              status: { [Op.in]: validOrderStatuses }
            }
          }]
        }],
        group: ['Product.id', 'Product.name'],
        order: [
          [literal('total_sales'), 'DESC'],
          [literal('total_revenue'), 'DESC']
        ],
        subQuery: false
      });

      return {
        ...plainCategory,
        top_product: topProduct ? topProduct.get({ plain: true }) : null,
      };
    }));

    res.json(categoryRows);
  } catch (error) {
    console.error('Error getTopProductsPerCategory:', error);
    res.status(500).json({ message: "Gagal mengambil data kategori terlaris" });
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
    const validOrderStatuses = ['completed', 'shipped', 'processing'];

    const topCreators = await User.findAll({
      where: {
        role: 'user',
        creator_status: 'approved',
      },
      attributes: [
        'id', 'name',
        [fn('COUNT', fn('DISTINCT', col('products.id'))), 'total_products'],
        [literal('IFNULL(SUM(`products->orderItems`.`quantity`), 0)'), 'total_sales'],
        [literal('IFNULL(SUM(`products->orderItems`.`price` * `products->orderItems`.`quantity`), 0)'), 'total_income']
      ],
      include: [{
        model: Product,
        as: 'products',
        attributes: [],
        required: true,
        include: [{
          model: OrderItem,
          as: 'orderItems',
          attributes: [],
          required: true,
          include: [{
            model: Order,
            attributes: [],
            required: true,
            where: {
              status: { [Op.in]: validOrderStatuses }
            }
          }]
        }]
      }],
      group: ['User.id', 'User.name'],
      order: [
        [literal('total_sales'), 'DESC'],
        [literal('total_income'), 'DESC']
      ],
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
  getAdmins,
  createAdmin,
  sendAdminPasswordReset,
  getPendingCreators, 
  verifyCreator, 
  getTopProductsPerCategory, 
  getDailyTransactions, 
  getTopCreators,
  getSystemStats 
};
