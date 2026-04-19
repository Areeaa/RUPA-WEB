const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require("../models/User");
const { Op } = require("sequelize");
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  try {
    // 1. Verifikasi token ke Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const { name, email, picture } = ticket.getPayload();

    // 2. Cek apakah user sudah ada
    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Jika belum ada, otomatis Register
      user = await User.create({
        name,
        email,
        profile_picture: picture,
        password: await bcrypt.hash(Math.random().toString(36), 10), // Password random karena login via Google
        role: 'user'
      });
    }

    // 3. Generate JWT kita sendiri
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({ message: 'Login Google Berhasil', token, user });

  } catch (error) {
    res.status(400).json({ message: 'Google Auth Gagal' });
  }
};

// Fungsi untuk Register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Cek apakah email sudah terdaftar
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email sudah terdaftar!" });
    }

    // 2. Enkripsi (Hash) password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Simpan user ke database
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // 4. Kirim respon sukses
    res.status(201).json({
      message: "Registrasi berhasil!",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Error saat register:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

// Fungsi untuk Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Email tidak ditemukan!" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Password salah!" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.status(200).json({
      message: "Login berhasil!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error saat login:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // Gunakan App Password Gmail
  }
});

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });

  if (!user) return res.status(404).json({ message: 'Email tidak terdaftar' });

  // Generate Token
  const token = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 Jam
  await user.save();

  // Kirim Email
  const resetUrl = `http://localhost:3000/reset-password/${token}`;
  const mailOptions = {
    to: user.email,
    subject: 'Pemulihan Kata Sandi - Figma Rupa',
    text: `Anda menerima email ini karena Anda (atau orang lain) meminta reset password. Klik link berikut: \n\n ${resetUrl}`
  };

  transporter.sendMail(mailOptions, (err) => {
    if (err) return res.status(500).json({ message: 'Gagal mengirim email' });
    res.status(200).json({ message: 'Email pemulihan terkirim!' });
  });
};

// --- 2. Eksekusi Reset Password ---
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  const user = await User.findOne({
    where: { 
      resetPasswordToken: token,
      resetPasswordExpires: { [Op.gt]: Date.now() } // Pastikan belum expired
    }
  });

  if (!user) return res.status(400).json({ message: 'Token tidak valid atau sudah kadaluwarsa' });

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  res.status(200).json({ message: 'Password berhasil diperbarui!' });
};


// Export fungsi register dan login
module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  googleLogin
};
