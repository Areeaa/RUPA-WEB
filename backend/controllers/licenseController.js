const LicenseApplication = require('../models/LicenseApplication');
const User = require('../models/User');

// ==========================================
// FITUR USER / PENGAJU
// ==========================================

// 1. User: Buat Pengajuan Baru
const submitLicense = async (req, res) => {
  try {
    const { nama_karya, nama_pengaju, jenis_lisensi, durasi, tujuan, deskripsi_karya } = req.body;
    const userId = req.user.id;

    // Validasi input sederhana
    if (!nama_karya || !nama_pengaju || !jenis_lisensi || !durasi) {
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
    res.status(200).json(licenses);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};


// ==========================================
// FITUR ADMIN DASHBOARD
// ==========================================

// 3. Admin: Lihat Daftar Pengajuan (Pending)
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

// 4. Admin: Verifikasi (Terima/Tolak)
const verifyLicense = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // action isinya 'approve' atau 'reject'

    const license = await LicenseApplication.findByPk(id);
    if (!license) return res.status(404).json({ message: 'Pengajuan tidak ditemukan!' });

    if (action === 'approve') {
      license.status = 'approved';
    } else if (action === 'reject') {
      license.status = 'rejected';
    } else {
      return res.status(400).json({ message: 'Aksi tidak valid! Gunakan approve / reject.' });
    }

    await license.save();
    res.status(200).json({ 
      message: `Pengajuan lisensi berhasil di-${action}`, 
      data: license 
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

module.exports = { submitLicense, getMyLicenses, getPendingLicenses, verifyLicense };