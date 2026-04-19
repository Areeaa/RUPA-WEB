const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Conversation = require('../models/Conversation');
const Product = require('../models/Product');
const Message = require('../models/Message');

const createInvoiceFromChat = async (req, res) => {
  try {
    // Tambahkan shipping_address dan shipping_cost di destructuring
    const { conversationId, productId, shipping_address, shipping_cost } = req.body;
    const sellerId = req.user.id;

    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation || conversation.sellerId !== sellerId) {
      return res.status(403).json({ message: 'Akses ditolak atau chat tidak ditemukan' });
    }

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });

    // Buat Order dengan data pengiriman
    const newOrder = await Order.create({
      total_price: product.price,
      shipping_cost: shipping_cost || 0,
      shipping_address: shipping_address || 'Alamat menyusul di chat',
      userId: conversation.buyerId,
      sellerId: sellerId,
      status: 'pending'
    });

    await OrderItem.create({
      orderId: newOrder.id,
      productId: product.id,
      quantity: 1,
      price: product.price
    });

    const totalBayar = parseInt(product.price) + parseInt(shipping_cost || 0);
    res.status(201).json({ message: 'Tagihan dibuat', order: newOrder });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan' });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ where: { id: orderId, userId: userId } });
    if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

    if (!req.file) {
      return res.status(400).json({ message: 'Bukti transfer wajib diunggah!' });
    }

    // Update status dan simpan link foto
    order.payment_proof = req.file.path;
    order.status = 'waiting_verification';
    await order.save();

    res.status(200).json({
      message: 'Pembayaran berhasil dikonfirmasi! Menunggu verifikasi penjual.',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action } = req.body; 
    
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

    if (action === 'approve') {
      // Pembayaran valid, lanjut ke proses pengemasan barang
      order.status = 'processing';
    } else {
      // Tolak, minta pembeli upload ulang
      order.status = 'pending';
      order.payment_proof = null;
    }

    await order.save();
    res.status(200).json({ message: `Status pesanan kini: ${order.status}` });
  } catch (error) {
    res.status(500).json({ message: 'Gagal verifikasi' });
  }
};

//input resi oleh penjual 
const inputResi = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { tracking_number } = req.body;
    const sellerId = req.user.id;

    if (!tracking_number) {
      return res.status(400).json({ message: 'Nomor resi wajib diisi!' });
    }

    // Cari order dan pastikan ini milik penjual yang benar
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: 'items', include: ['Product'] }]
    });

    if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

    // Pastikan statusnya memang sedang diproses
    if (order.status !== 'processing') {
      return res.status(400).json({ message: 'Pesanan belum dibayar atau sudah dikirim.' });
    }

    // Update status dan masukkan resi
    order.tracking_number = tracking_number;
    order.status = 'shipped';
    await order.save();

    // Opsional: Kirim pesan otomatis ke chat bahwa barang sudah dikirim
    const conversation = await Conversation.findOne({
      where: { buyerId: order.userId, sellerId: sellerId }
    });
    
    if (conversation) {
      await Message.create({
        conversationId: conversation.id,
        senderId: sellerId,
        text: `🚚 Pesanan #${order.id} telah dikirim!\nNomor Resi: ${tracking_number}\nSilakan lacak pengiriman Anda.`
      });
    }

    res.status(200).json({ message: 'Resi berhasil diinput, status pesanan menjadi Dikirim!', order });

  } catch (error) {
    console.error('Error input resi:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

// Terima konfirmasi barang diterima oleh pembeli
const completeOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Cari order dan pastikan ini milik pembeli yang login
    const order = await Order.findOne({ where: { id: orderId, userId: userId } });
    if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

    if (order.status !== 'shipped') {
      return res.status(400).json({ message: 'Pesanan belum dikirim oleh penjual.' });
    }

    // Selesaikan pesanan
    order.status = 'completed';
    await order.save();

    // UPDATE JUMLAH TERJUAL: Iterasi semua item di order ini
    const orderItems = await OrderItem.findAll({ where: { orderId: order.id } });
    for (const item of orderItems) {
      const product = await Product.findByPk(item.productId);
      if (product) {
        product.sold_count = (product.sold_count || 0) + item.quantity;
        await product.save();
      }
    }

    res.status(200).json({ message: 'Pesanan selesai! Terima kasih telah berbelanja.', order });

  } catch (error) {
    console.error('Error complete order:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

// Lihat pesanan user sendiri
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { Op } = require('sequelize');

    // AUTO CANCEL: Batalkan pesanan 'pending' yang sudah lebih dari 24 jam
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await Order.update(
      { status: 'cancelled' },
      { 
        where: { 
          status: 'pending', 
          createdAt: { [Op.lt]: twentyFourHoursAgo } 
        } 
      }
    );

    const orders = await Order.findAll({
      where: { userId },
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{
          model: Product,
          attributes: ['id', 'name', 'images', 'price']
        }]
      }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error get my orders:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

// Lihat pesanan yang masuk ke toko saya (sebagai penjual)
const getReceivedOrders = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { Op } = require('sequelize');

    // AUTO CANCEL: Batalkan pesanan 'pending' yang sudah lebih dari 24 jam
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await Order.update(
      { status: 'cancelled' },
      { 
        where: { 
          status: 'pending', 
          createdAt: { [Op.lt]: twentyFourHoursAgo } 
        } 
      }
    );

    const orders = await Order.findAll({
      where: { sellerId },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: Product,
            attributes: ['id', 'name', 'images', 'price']
          }]
        },
        {
          model: require('../models/User'),
          as: 'buyer',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error get received orders:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

module.exports = { createInvoiceFromChat, confirmPayment, verifyPayment, inputResi, completeOrder, getMyOrders, getReceivedOrders };