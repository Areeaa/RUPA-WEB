const Review = require('../models/Review');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');

// --- 1. PEMBELI: Menambah Ulasan ---
const createReview = async (req, res) => {
  try {
    const { orderId, productId, rating, comment } = req.body;
    const userId = req.user.id;

    // 1. Validasi Rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating harus antara 1 hingga 5 bintang!' });
    }

    // 2. Cek apakah pesanan ini milik user tersebut dan statusnya SUDAH SELESAI
    const order = await Order.findOne({ 
      where: { id: orderId, userId: userId, status: 'completed' },
      include: [{ model: OrderItem, as: 'items' }]
    });

    if (!order) {
      return res.status(403).json({ message: 'Pesanan tidak ditemukan atau belum selesai.' });
    }

    // 3. Pastikan produk yang di-review benar-benar ada di dalam pesanan tersebut
    const isProductInOrder = order.items.some(item => item.productId === parseInt(productId));
    if (!isProductInOrder) {
      return res.status(400).json({ message: 'Produk ini tidak ada dalam pesanan Anda!' });
    }

    // 4. Cegah Review Ganda (1 Pesanan hanya boleh 1 kali review per produk)
    const existingReview = await Review.findOne({ where: { orderId, productId } });
    if (existingReview) {
      return res.status(400).json({ message: 'Anda sudah memberikan ulasan untuk pesanan ini.' });
    }

    // 5. Simpan Ulasan
    const newReview = await Review.create({
      rating,
      comment,
      userId,
      productId,
      orderId
    });

    // 6. Update Rating & Review Count di Tabel Produk
    const Product = require('../models/Product');
    const allReviews = await Review.findAll({ where: { productId } });
    const avgRating = allReviews.reduce((acc, cur) => acc + cur.rating, 0) / allReviews.length;
    
    await Product.update(
      { 
        rating: parseFloat(avgRating.toFixed(1)), 
        review_count: allReviews.length 
      },
      { where: { id: productId } }
    );

    res.status(201).json({ message: 'Terima kasih atas ulasan Anda!', review: newReview });

  } catch (error) {
    console.error('Error create review:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

// --- 2. PUBLIK: Mengambil Daftar Ulasan Sebuah Produk ---
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.findAll({
      where: { productId },
      include: [{ 
        model: require('../models/User'), 
        as: 'reviewer', 
        attributes: ['id', 'name', 'profile_picture'] // Hanya ambil info dasar user
      }],
      order: [['createdAt', 'DESC']] // Urutkan dari yang paling baru
    });

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error get reviews:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

module.exports = { createReview, getProductReviews };