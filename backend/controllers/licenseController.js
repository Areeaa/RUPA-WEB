const LicenseApplication = require('../models/LicenseApplication');
const User = require('../models/User');

// Info rekening tetap platform RUPA
const PLATFORM_PAYMENT_INFO = {
  bank_name: 'BNI',
  bank_account_number: '1859488855',
  bank_account_holder: 'Fauzan Fadlullah',
};

// ==========================================
// FITUR USER / PENGAJU
// ==========================================

// 1. User: Buat Pengajuan Baru
const submitLicense = async (req, res) => {
  try {
    const { nama_karya, nama_pengaju, jenis_lisensi, durasi, tujuan, deskripsi_karya } = req.body;
    const userId = req.user.id;

    // Validasi input sederhana
    if (!nama_karya || !nama_pengaju || !jenis_lisensi || !durasi || !tujuan || !deskripsi_karya) {
      return res.status(400).json({ message: 'Mohon lengkapi semua field yang diwajibkan!' });
    }

    const newLicense = await LicenseApplication.create({
      nama_karya,
      nama_pengaju,
      jenis_lisensi,
      durasi,
      tujuan,
      deskripsi_karya,
      userId
    });

    res.status(201).json({ message: 'Pengajuan lisensi berhasil dikirim!', data: newLicense });
  } catch (error) {
    console.error('Error submit license:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// 2. User: Lihat Riwayat Pengajuan Sendiri
const getMyLicenses = async (req, res) => {
  try {
    const licenses = await LicenseApplication.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    // Sertakan info rekening platform pada setiap lisensi yang butuh pembayaran
    const licensesWithPaymentInfo = licenses.map(lic => {
      const data = lic.toJSON();
      if (['approved_pending_payment', 'payment_rejected'].includes(data.status)) {
        data.platform_payment_info = PLATFORM_PAYMENT_INFO;
      }
      return data;
    });

    res.status(200).json(licensesWithPaymentInfo);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

// 3. User: Upload Bukti Pembayaran Lisensi
const uploadLicensePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const license = await LicenseApplication.findOne({ where: { id, userId } });
    if (!license) {
      return res.status(404).json({ message: 'Pengajuan lisensi tidak ditemukan atau bukan milik Anda.' });
    }

    // Hanya bisa upload jika status approved_pending_payment atau payment_rejected
    if (!['approved_pending_payment', 'payment_rejected'].includes(license.status)) {
      return res.status(400).json({ 
        message: 'Tidak dapat mengupload bukti pembayaran untuk pengajuan dengan status ini.' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'File bukti pembayaran wajib diunggah!' });
    }

    license.payment_proof = req.file.path;
    license.payment_proof_at = new Date();
    license.status = 'waiting_verification';
    await license.save();

    res.status(200).json({
      message: 'Bukti pembayaran berhasil diunggah! Menunggu verifikasi admin.',
      data: license,
    });
  } catch (error) {
    console.error('Error upload license payment:', error);
    res.status(500).json({ message: 'Gagal mengunggah bukti pembayaran.' });
  }
};


// ==========================================
// FITUR ADMIN DASHBOARD
// ==========================================

// 4. Admin: Lihat Semua Pengajuan (dengan filter status)
const getAllLicenses = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    const validStatuses = [
      'pending', 'approved_pending_payment', 'waiting_verification',
      'active', 'payment_rejected', 'rejected'
    ];

    if (status && validStatuses.includes(status)) {
      where.status = status;
    }

    const licenses = await LicenseApplication.findAll({
      where,
      include: [
        { model: User, as: 'pemohon', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'approver', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(licenses);
  } catch (error) {
    console.error('Error get all licenses:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

// 5. Admin: Lihat Daftar Pengajuan (Pending) — backward compat
const getPendingLicenses = async (req, res) => {
  try {
    const licenses = await LicenseApplication.findAll({
      where: { status: 'pending' },
      include: [{ model: User, as: 'pemohon', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'ASC']] // Yang paling lama mengantre muncul duluan
    });
    res.status(200).json(licenses);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

// 6. Admin: Verifikasi Pengajuan (Approve dengan tagihan / Reject)
const verifyLicense = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, admin_fee, admin_note } = req.body;

    const license = await LicenseApplication.findByPk(id);
    if (!license) return res.status(404).json({ message: 'Pengajuan tidak ditemukan!' });

    if (action === 'approve') {
      // Validasi: admin harus mengisi biaya lisensi
      const parsedFee = Number(admin_fee);
      if (!parsedFee || parsedFee < 1000) {
        return res.status(400).json({ 
          message: 'Biaya lisensi wajib diisi (minimal Rp 1.000).' 
        });
      }

      license.status = 'approved_pending_payment';
      license.admin_fee = parsedFee;
      license.admin_note = admin_note || null;
      license.approved_at = new Date();
      license.approved_by = req.user.id;

    } else if (action === 'reject') {
      license.status = 'rejected';
      license.admin_note = admin_note || null;
    } else {
      return res.status(400).json({ message: 'Aksi tidak valid! Gunakan approve / reject.' });
    }

    await license.save();
    res.status(200).json({ 
      message: action === 'approve' 
        ? 'Pengajuan disetujui! Tagihan pembayaran telah dikirim ke pengaju.'
        : 'Pengajuan lisensi ditolak.',
      data: license 
    });
  } catch (error) {
    console.error('Error verify license:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

// 7. Admin: Verifikasi Pembayaran Lisensi
const verifyLicensePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, admin_note } = req.body;

    const license = await LicenseApplication.findByPk(id);
    if (!license) return res.status(404).json({ message: 'Pengajuan tidak ditemukan!' });

    if (license.status !== 'waiting_verification') {
      return res.status(400).json({ 
        message: 'Pengajuan ini tidak sedang menunggu verifikasi pembayaran.' 
      });
    }

    if (action === 'approve') {
      license.status = 'active';
      license.verified_at = new Date();
      license.admin_note = admin_note || license.admin_note;
    } else if (action === 'reject') {
      license.status = 'payment_rejected';
      license.admin_note = admin_note || 'Bukti pembayaran tidak valid. Silakan upload ulang.';
      // Reset bukti bayar agar user bisa upload ulang
      license.payment_proof = null;
      license.payment_proof_at = null;
    } else {
      return res.status(400).json({ message: 'Aksi tidak valid! Gunakan approve / reject.' });
    }

    await license.save();
    res.status(200).json({
      message: action === 'approve' 
        ? 'Pembayaran terverifikasi! Lisensi sekarang aktif.'
        : 'Bukti pembayaran ditolak. Pengaju diminta upload ulang.',
      data: license,
    });
  } catch (error) {
    console.error('Error verify license payment:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

module.exports = { 
  submitLicense, 
  getMyLicenses, 
  uploadLicensePayment,
  getAllLicenses,
  getPendingLicenses, 
  verifyLicense, 
  verifyLicensePayment 
};
