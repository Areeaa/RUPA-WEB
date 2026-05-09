const { fn, col, Op } = require('sequelize');
const Donation = require('../models/Donation');
const User = require('../models/User');

const validDonationStatuses = ['pending', 'approved', 'distributed', 'rejected'];

const createDonation = async (req, res) => {
  try {
    const { creatorId, amount, message } = req.body;
    const parsedAmount = Number(amount);

    if (!creatorId) {
      return res.status(400).json({ message: 'Kreator tujuan donasi wajib dipilih.' });
    }

    if (!Number.isInteger(parsedAmount) || parsedAmount < 1000) {
      return res.status(400).json({ message: 'Nominal donasi minimal Rp 1.000.' });
    }

    if (Number(creatorId) === req.user.id) {
      return res.status(400).json({ message: 'Anda tidak dapat mengirim donasi ke akun sendiri.' });
    }

    const creator = await User.findOne({
      where: {
        id: creatorId,
        role: 'user',
        creator_status: 'approved',
      },
    });

    if (!creator) {
      return res.status(404).json({ message: 'Kreator tidak ditemukan atau belum terverifikasi.' });
    }

    const donation = await Donation.create({
      donorId: req.user.id,
      creatorId,
      amount: parsedAmount,
      message: message ? String(message).trim() : null,
    });

    res.status(201).json({
      message: 'Donasi berhasil dikirim dan menunggu review admin.',
      donation,
    });
  } catch (error) {
    console.error('Error create donation:', error);
    res.status(500).json({ message: 'Gagal mengirim donasi.' });
  }
};

const getDonations = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status && validDonationStatuses.includes(status)) {
      where.status = status;
    }

    const donations = await Donation.findAll({
      where,
      include: [{
        model: User,
        as: 'donor',
        attributes: ['id', 'name', 'email'],
      }, {
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email'],
      }, {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'name', 'email'],
      }],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(donations);
  } catch (error) {
    console.error('Error get donations:', error);
    res.status(500).json({ message: 'Gagal mengambil data donasi.' });
  }
};

const getDonationStats = async (req, res) => {
  try {
    const summary = await Donation.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'total_count'],
        [fn('IFNULL', fn('SUM', col('amount')), 0), 'total_amount'],
      ],
      group: ['status'],
      raw: true,
    });

    const pendingAmount = await Donation.sum('amount', { where: { status: 'pending' } });
    const distributedAmount = await Donation.sum('amount', { where: { status: 'distributed' } });

    res.status(200).json({
      summary,
      pendingAmount: pendingAmount || 0,
      distributedAmount: distributedAmount || 0,
    });
  } catch (error) {
    console.error('Error get donation stats:', error);
    res.status(500).json({ message: 'Gagal mengambil statistik donasi.' });
  }
};

const reviewDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminNote } = req.body;
    const allowedActions = ['approve', 'reject', 'distribute'];

    if (!allowedActions.includes(action)) {
      return res.status(400).json({ message: 'Aksi donasi tidak valid.' });
    }

    const donation = await Donation.findByPk(id);
    if (!donation) {
      return res.status(404).json({ message: 'Donasi tidak ditemukan.' });
    }

    if (action === 'approve') {
      donation.status = 'approved';
    }

    if (action === 'reject') {
      donation.status = 'rejected';
    }

    if (action === 'distribute') {
      if (!['approved', 'pending'].includes(donation.status)) {
        return res.status(400).json({ message: 'Donasi ini tidak dapat didistribusikan.' });
      }
      donation.status = 'distributed';
      donation.distributedAt = new Date();
    }

    donation.adminNote = adminNote || null;
    donation.reviewedById = req.user.id;
    donation.reviewedAt = new Date();
    await donation.save();

    res.status(200).json({
      message: 'Status donasi berhasil diperbarui.',
      donation,
    });
  } catch (error) {
    console.error('Error review donation:', error);
    res.status(500).json({ message: 'Gagal memproses donasi.' });
  }
};

module.exports = {
  createDonation,
  getDonations,
  getDonationStats,
  reviewDonation,
};
