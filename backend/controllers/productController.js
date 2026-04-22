const Product = require('../models/Product');
const User = require('../models/User');
const Category = require('../models/Category'); 
const { Op } = require('sequelize');

// Fitur Tambah Produk Baru
const createProduct = async (req, res) => {
  try {
    // 1. Ambil data teks dari body request
    const { name, description, price, category } = req.body;
    
    // 2. Ambil ID Kreator dari token JWT (satpam yang kita buat sebelumnya)
    const userId = req.user.id; 

    // 3. Ambil URL gambar yang sudah berhasil di-upload ke Cloudinary
    // req.files adalah array yang dihasilkan oleh multer
    const imageUrls = req.files ? req.files.map(file => file.path) : [];

    // 4. Validasi minimal 1 gambar (opsional, sesuaikan kebutuhan)
    if (imageUrls.length === 0) {
      return res.status(400).json({ message: 'Minimal harus mengunggah 1 foto produk!' });
    }

    // 5. Simpan ke Database MySQL
    const newProduct = await Product.create({
      name,
      description,
      price: parseInt(price), 
      categoryId: parseInt(req.body.categoryId) || null, // FIX: Gunakan categoryId
      userId,
      images: imageUrls, 
    });

    res.status(201).json({
      message: 'Produk berhasil ditambahkan!',
      product: newProduct
    });

  } catch (error) {
    console.error('Error saat tambah produk:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};


const getAllProducts = async (req, res) => {
  try {
    const { search, categoryId, minPrice, maxPrice } = req.query;
    const where = {};

    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseInt(minPrice);
      if (maxPrice) where.price[Op.lte] = parseInt(maxPrice);
    }

    const products = await Product.findAll({
      where,
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }, {
        model: User,
        as: 'creator',
        attributes: ['id', 'name']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(products);
  } catch (error) {
    console.error('Error get products:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// get product by id
const getProductById = async (req, res) => {
  try {
    const productId = req.params.id; 
    
    const product = await Product.findByPk(productId, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name']
      }, {
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }]
    });

    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan!' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Error ambil detail produk:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// Fitur Edit Produk, Hapus Produk, dll bisa ditambahkan di sini sesuai kebutuhan
// updateProduct
const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user.id; // Diambil dari token
    const { name, description, price, categoryId } = req.body;

    // 1. Cari produk berdasarkan ID dan pastikan itu milik user yang sedang login
    const product = await Product.findOne({ where: { id: productId, userId: userId } });
    
    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan atau Anda bukan pemiliknya!' });
    }

    // 2. Update data teks
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = parseInt(price);
    if (categoryId) product.categoryId = categoryId;

    // 3. Update Gambar (Opsional: Jika user mengupload gambar baru, kita timpa yang lama)
    if (req.files && req.files.length > 0) {
      // (Opsional tingkat lanjut) Hapus gambar lama dari Cloudinary di sini jika mau
      
      const newImageUrls = req.files.map(file => file.path);
      product.images = newImageUrls;
    }

    await product.save();

    res.status(200).json({
      message: 'Produk berhasil diperbarui!',
      product
    });

  } catch (error) {
    console.error('Error update produk:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// deleteProduct
const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user.id;

    // 1. Cari produk dan pastikan itu milik kreator ini
    const product = await Product.findOne({ where: { id: productId, userId: userId } });

    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan atau Anda bukan pemiliknya!' });
    }

    // 2. Hapus semua foto produk ini dari Cloudinary agar hemat storage
    if (product.images && product.images.length > 0) {
      const extractPublicId = (url) => {
        const parts = url.split('/');
        return parts.slice(-2).join('/').split('.')[0]; 
      };

      for (const imageUrl of product.images) {
        const publicId = extractPublicId(imageUrl);
        if (publicId) await cloudinary.uploader.destroy(publicId);
      }
    }

    // 3. Hapus data dari MySQL
    await product.destroy();

    res.status(200).json({ message: 'Produk berhasil dihapus permanen!' });

  } catch (error) {
    console.error('Error hapus produk:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};


// Get produk milik user yang sedang login
const getMyProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const products = await Product.findAll({
      where: { userId },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error get my products:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// Get produk milik user tertentu (untuk halaman profil)
const getProductsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const products = await Product.findAll({
      where: { userId },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error get products by user:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getProductsByUser
};