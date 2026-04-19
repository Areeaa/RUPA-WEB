const Category = require('../models/Category');

// --- 1. ADMIN: Tambah Kategori Baru ---
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Nama kategori wajib diisi!' });
    }

    // Cek apakah kategori dengan nama yang sama sudah ada
    const existingCategory = await Category.findOne({ where: { name } });
    if (existingCategory) {
      return res.status(400).json({ message: 'Kategori ini sudah ada di database!' });
    }

    // Simpan ke database
    const newCategory = await Category.create({ name });

    res.status(201).json({
      message: 'Kategori berhasil ditambahkan!',
      category: newCategory
    });

  } catch (error) {
    console.error('Error tambah kategori:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// --- 2. PUBLIK: Ambil Semua Kategori (Untuk Dropdown di Frontend) ---
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error ambil kategori:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// --- 3. ADMIN: Update Kategori ---
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan!' });
    }

    // Cek jika nama baru ternyata sudah dipakai kategori lain
    const existing = await Category.findOne({ where: { name } });
    if (existing && existing.id !== parseInt(id)) {
      return res.status(400).json({ message: 'Nama kategori sudah ada!' });
    }

    category.name = name;
    await category.save();

    res.status(200).json({ message: 'Kategori berhasil diperbarui!', category });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// --- 4. ADMIN: Hapus Kategori ---
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan!' });
    }

    // Catatan: Jika ada produk yang menggunakan kategori ini, 
    // biasanya database akan menolak hapus (Restricted) atau kita bisa beri validasi manual.
    await category.destroy();

    res.status(200).json({ message: 'Kategori berhasil dihapus!' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory
};