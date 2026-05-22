const ReturnRequest = require('../models/ReturnRequest');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const User = require('../models/User');

const validAdminActions = ['review', 'approve', 'reject', 'process', 'complete'];

const includeReturnDetails = [{
  model: Order,
  as: 'order',
  attributes: ['id', 'createdAt', 'status', 'total_price', 'shipping_cost'],
}, {
  model: OrderItem,
  as: 'orderItem',
  attributes: ['id', 'quantity', 'price'],
}, {
  model: Product,
  as: 'product',
  attributes: ['id', 'name', 'images', 'price'],
}, {
  model: User,
  as: 'buyer',
  attributes: ['id', 'name', 'email'],
}, {
  model: User,
  as: 'seller',
  attributes: ['id', 'name', 'email'],
}, {
  model: User,
  as: 'reviewer',
  attributes: ['id', 'name', 'email'],
}];

const createReturnCode = () => `RET-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const createReturnRequest = async (req, res) => {
  try {
    const { orderId, orderItemId, reason, returnType, quantity, description, additionalNotes } = req.body;
    const buyerId = req.user.id;

    if (!orderId || !orderItemId || !reason || !returnType || !description) {
      return res.status(400).json({ message: 'Mohon lengkapi data retur.' });
    }

    if (!['refund', 'replacement'].includes(returnType)) {
      return res.status(400).json({ message: 'Jenis retur tidak valid.' });
    }

    const order = await Order.findOne({
      where: { id: orderId, userId: buyerId },
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{ model: Product }],
      }],
    });

    if (!order) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
    }

    if (order.status !== 'completed') {
      return res.status(400).json({ message: 'Retur hanya dapat diajukan untuk pesanan yang sudah selesai.' });
    }

    const item = order.items.find((orderItem) => Number(orderItem.id) === Number(orderItemId));
    if (!item) {
      return res.status(404).json({ message: 'Item pesanan tidak ditemukan.' });
    }

    const parsedQuantity = Number(quantity || 1);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > item.quantity) {
      return res.status(400).json({ message: 'Jumlah retur tidak valid.' });
    }

    const { Op } = require('sequelize');
    const existingReturn = await ReturnRequest.findOne({
      where: {
        orderItemId: item.id,
        buyerId,
        status: { [Op.notIn]: ['rejected'] },
      },
    });

    if (existingReturn) {
      return res.status(400).json({ message: 'Item ini sudah memiliki pengajuan retur yang aktif.' });
    }

    const files = req.files || {};
    const evidenceFiles = files.evidence || [];
    const videoFile = (files.video || evidenceFiles.filter((file) => file.mimetype?.startsWith('video/')))[0];
    const photoFiles = [
      ...(files.photos || []),
      ...evidenceFiles.filter((file) => file.mimetype?.startsWith('image/')),
    ].slice(0, 5);

    if (!videoFile && photoFiles.length === 0) {
      return res.status(400).json({ message: 'Minimal satu bukti foto/video wajib diunggah.' });
    }

    const returnRequest = await ReturnRequest.create({
      return_code: createReturnCode(),
      orderId: order.id,
      orderItemId: item.id,
      productId: item.productId,
      buyerId,
      sellerId: order.sellerId,
      reason,
      return_type: returnType,
      quantity: parsedQuantity,
      description,
      additional_notes: additionalNotes || null,
      video_evidence: videoFile?.path || null,
      photo_evidence: photoFiles.map((file) => file.path),
      refund_amount: returnType === 'refund' ? item.price * parsedQuantity : null,
    });

    const fullReturn = await ReturnRequest.findByPk(returnRequest.id, { include: includeReturnDetails });
    res.status(201).json({ message: 'Pengajuan retur berhasil dikirim.', returnRequest: fullReturn });
  } catch (error) {
    console.error('Error create return request:', error);
    res.status(500).json({ message: 'Gagal mengirim pengajuan retur.' });
  }
};

const getMyReturns = async (req, res) => {
  try {
    const returns = await ReturnRequest.findAll({
      where: { buyerId: req.user.id },
      include: includeReturnDetails,
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(returns);
  } catch (error) {
    console.error('Error get my returns:', error);
    res.status(500).json({ message: 'Gagal mengambil riwayat retur.' });
  }
};

const getAdminReturns = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    const returns = await ReturnRequest.findAll({
      where,
      include: includeReturnDetails,
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(returns);
  } catch (error) {
    console.error('Error get admin returns:', error);
    res.status(500).json({ message: 'Gagal mengambil data retur.' });
  }
};

const reviewReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminNote, rejectionReason, refundAmount } = req.body;

    if (!validAdminActions.includes(action)) {
      return res.status(400).json({ message: 'Aksi retur tidak valid.' });
    }

    const returnRequest = await ReturnRequest.findByPk(id);
    if (!returnRequest) {
      return res.status(404).json({ message: 'Pengajuan retur tidak ditemukan.' });
    }

    if (action === 'review') returnRequest.status = 'in_review';
    if (action === 'approve') returnRequest.status = 'approved';
    if (action === 'process') returnRequest.status = 'processing';
    if (action === 'complete') {
      returnRequest.status = 'completed';
      returnRequest.completedAt = new Date();
    }
    if (action === 'reject') {
      returnRequest.status = 'rejected';
      returnRequest.rejection_reason = rejectionReason || adminNote || null;
    }

    returnRequest.admin_notes = adminNote || returnRequest.admin_notes;
    if (refundAmount !== undefined && refundAmount !== null && refundAmount !== '') {
      returnRequest.refund_amount = Number(refundAmount);
    }
    returnRequest.reviewedById = req.user.id;
    returnRequest.reviewedAt = new Date();
    await returnRequest.save();

    const fullReturn = await ReturnRequest.findByPk(returnRequest.id, { include: includeReturnDetails });
    res.status(200).json({ message: 'Status retur berhasil diperbarui.', returnRequest: fullReturn });
  } catch (error) {
    console.error('Error review return:', error);
    res.status(500).json({ message: 'Gagal memproses retur.' });
  }
};

module.exports = {
  createReturnRequest,
  getMyReturns,
  getAdminReturns,
  reviewReturn,
};
