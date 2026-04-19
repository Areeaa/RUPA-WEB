const bcrypt = require('bcrypt');
const User = require('../models/User');
const Product = require('../models/Product'); // Untuk menarik data karya kreator

// --- Fitur 1: Lihat Profil & Etalase Karya ---
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      // Hilangkan password dari balasan API demi keamanan
      attributes: { exclude: ['password'] }, 
      // Ambil juga semua produk buatan user ini
      include: [{
        model: Product,
        as: 'products',
      }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan!' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error ambil profil:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// --- Fitur 2: Update Data Profil ---
const updateProfile = async (req, res) => {
  try {
    const { name, email, password, current_password } = req.body;
    
    // Cari user yang sedang login
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan!' });
    }

    // --- LOGIKA PENGAMANAN SENSITIF (EMAIL & PASSWORD) ---
    // Jika user mencoba mengganti email ATAU mengganti password
    if ((email && email !== user.email) || password) {
      
      // 1. Wajib ada current_password
      if (!current_password) {
        return res.status(400).json({ 
          message: 'Konfirmasi password saat ini diperlukan untuk mengubah keamanan akun!' 
        });
      }

      // 2. Verifikasi apakah current_password benar
      const isPasswordCorrect = await bcrypt.compare(current_password, user.password);
      if (!isPasswordCorrect) {
        return res.status(401).json({ message: 'Password saat ini salah!' });
      }
    }

    // --- EKSEKUSI UPDATE SETELAH LOLOS VERIFIKASI ---
    
    // Update Email
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email sudah terdaftar oleh akun lain!' });
      }
      user.email = email;
    }

    // Update Password Baru
    if (password) {
      const saltRounds = 10;
      user.password = await bcrypt.hash(password, saltRounds);
    }

    // Update Nama
    if (name) user.name = name;

    // --- Update Field Baru ---
    if (req.body.themeColor) user.themeColor = req.body.themeColor;
    if (req.body.language) user.language = req.body.language;
    if (req.body.fullName) user.fullName = req.body.fullName;
    if (req.body.phoneNumber) user.phoneNumber = req.body.phoneNumber;
    if (req.body.address) user.address = req.body.address;
    if (req.body.gender) user.gender = req.body.gender;
    if (req.body.age) user.age = req.body.age;

    // Update Foto Profil
    if (req.file) {
      user.profile_picture = req.file.path; 
    }

    // Simpan semua perubahan
    await user.save();

    // Sembunyikan password sebelum dikirim kembali
    const updatedUser = user.toJSON();
    delete updatedUser.password;

    res.status(200).json({
      message: 'Profil berhasil diperbarui!',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error update profil:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// --- Fitur: Ganti Password ---
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Password lama dan baru wajib diisi!' });
    }

    const isPasswordCorrect = await bcrypt.compare(current_password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Password saat ini salah!' });
    }

    user.password = await bcrypt.hash(new_password, 10);
    await user.save();

    res.status(200).json({ message: 'Password berhasil diperbarui!' });
  } catch (error) {
    console.error('Error change password:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// fitur 3 pengajuan kreator
const applyForCreator = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    
    // Cegah user yang sudah approved/pending untuk daftar lagi
    if (user.creator_status === 'approved') {
      return res.status(400).json({ message: 'Anda sudah menjadi kreator!' });
    }
    if (user.creator_status === 'pending') {
      return res.status(400).json({ message: 'Pengajuan Anda sedang diproses admin.' });
    }

    // Pastikan kedua file (KTP dan Selfie) ter-upload
    if (!req.files || !req.files['ktp_image'] || !req.files['selfie_image']) {
      return res.status(400).json({ message: 'Foto KTP dan Selfie wajib diunggah!' });
    }

    // Ambil URL dari Cloudinary
    user.ktp_image = req.files['ktp_image'][0].path;
    user.selfie_ktp_image = req.files['selfie_image'][0].path;
    
    // Ubah status dari 'none' atau 'rejected' menjadi 'pending'
    user.creator_status = 'pending';

    await user.save();

    res.status(200).json({ 
      message: 'Pengajuan berhasil dikirim! Silakan tunggu verifikasi Admin.',
      status: user.creator_status
    });

  } catch (error) {
    console.error('Error saat pengajuan kreator:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  applyForCreator
};