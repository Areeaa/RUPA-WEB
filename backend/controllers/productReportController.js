const ProductReport = require('../models/ProductReport');
const Product = require('../models/Product');
const User = require('../models/User');
const Category = require('../models/Category');

const reportReasons = ['fraud', 'counterfeit', 'inappropriate', 'copyright', 'other'];
const reportStatuses = ['pending', 'reviewed', 'resolved', 'rejected'];

const createProductReport = async (req, res) => {
  try {
    const productId = req.params.productId || req.body.productId;
    const { reason, description } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Produk wajib dipilih.' });
    }

    if (!reportReasons.includes(reason)) {
      return res.status(400).json({ message: 'Kategori laporan tidak valid.' });
    }

    if (!description || description.trim().length < 10) {
      return res.status(400).json({ message: 'Detail laporan minimal 10 karakter.' });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    }

    if (product.userId === req.user.id) {
      return res.status(400).json({ message: 'Anda tidak dapat melaporkan produk sendiri.' });
    }

    const existingPendingReport = await ProductReport.findOne({
      where: {
        productId,
        reporterId: req.user.id,
        status: 'pending',
      },
    });

    if (existingPendingReport) {
      return res.status(409).json({ message: 'Laporan Anda untuk produk ini masih menunggu review admin.' });
    }

    const report = await ProductReport.create({
      productId,
      reporterId: req.user.id,
      reason,
      description: description.trim(),
    });

    res.status(201).json({
      message: 'Laporan produk berhasil dikirim.',
      report,
    });
  } catch (error) {
    console.error('Error create product report:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

const getProductReports = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status && reportStatuses.includes(status)) {
      where.status = status;
    }

    const reports = await ProductReport.findAll({
      where,
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'price', 'images', 'status', 'userId'],
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        }, {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        }],
      }, {
        model: User,
        as: 'reporter',
        attributes: ['id', 'name', 'email'],
      }, {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'name', 'email'],
      }],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(reports);
  } catch (error) {
    console.error('Error get product reports:', error);
    res.status(500).json({ message: 'Gagal mengambil data laporan produk.' });
  }
};

const reviewProductReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, resolution } = req.body;

    const allowedActions = ['review', 'resolve', 'reject', 'suspend_product', 'activate_product'];
    if (!allowedActions.includes(action)) {
      return res.status(400).json({ message: 'Aksi tidak valid.' });
    }

    const report = await ProductReport.findByPk(id, {
      include: [{ model: Product, as: 'product' }],
    });

    if (!report) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan.' });
    }

    if (action === 'review') {
      report.status = 'reviewed';
    }

    if (action === 'resolve') {
      report.status = 'resolved';
    }

    if (action === 'reject') {
      report.status = 'rejected';
    }

    if (action === 'suspend_product') {
      if (report.product) {
        report.product.status = 'suspended';
        await report.product.save();
      }
      report.status = 'resolved';
    }

    if (action === 'activate_product') {
      if (report.product) {
        report.product.status = 'active';
        await report.product.save();
      }
      report.status = 'resolved';
    }

    report.resolution = resolution || null;
    report.reviewedById = req.user.id;
    report.reviewedAt = new Date();
    await report.save();

    res.status(200).json({
      message: 'Laporan berhasil diperbarui.',
      report,
    });
  } catch (error) {
    console.error('Error review product report:', error);
    res.status(500).json({ message: 'Gagal memproses laporan produk.' });
  }
};

module.exports = {
  createProductReport,
  getProductReports,
  reviewProductReport,
};
