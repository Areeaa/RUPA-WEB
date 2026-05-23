const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Product = require('../models/Product');

const startOrGetChat = async (req, res) => {
  try {
    const buyerId = req.user.id; // User yang sedang login
    const { productId } = req.body;

    // 1. Cari tahu siapa pemilik produk ini
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    
    const sellerId = product.userId;

    // Cegah user chat dengan dirinya sendiri
    if (buyerId === sellerId) {
      return res.status(400).json({ message: 'Anda tidak bisa chat dengan diri sendiri!' });
    }

    // 2. Cek apakah ruang chat antara pembeli ini dan penjual ini sudah ada
    let conversation = await Conversation.findOne({
      where: { buyerId, sellerId }
    });

    // 3. Jika belum ada, buat ruang chat baru
    if (!conversation) {
      conversation = await Conversation.create({ buyerId, sellerId });
    }

    // 4. Buat PESAN OTOMATIS yang menyematkan konteks Produk
    await Message.create({
      conversationId: conversation.id,
      senderId: buyerId,
      text: `Halo, saya tertarik dengan produk ${product.name}. Apakah masih tersedia?`,
      productId: product.id
    });

    // 5. Kembalikan ID ruang chat agar Frontend bisa me-redirect user ke /chat/:id
    res.status(200).json({
      message: 'Chat berhasil dimulai',
      conversationId: conversation.id
    });

  } catch (error) {
    console.error('Error start chat:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// get messages
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id; // User yang sedang login

    // 1. Cari ruang chatnya beserta info buyer
    const conversation = await Conversation.findByPk(conversationId, {
      include: [
        { model: require('../models/User'), as: 'buyer', attributes: ['id', 'name', 'address'] }
      ]
    });
    if (!conversation) {
      return res.status(404).json({ message: 'Ruang chat tidak ditemukan!' });
    }

    // 2. SATPAM SPESIFIK: Pastikan user yang login adalah Pembeli ATAU Penjual di ruang chat ini
    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      return res.status(403).json({ message: 'Akses ditolak! Ini bukan ruang chat Anda.' });
    }

    // 3. Ambil semua pesannya beserta nama pengirim dan info produk (jika ada)
    const messages = await Message.findAll({
      where: { conversationId },
      order: [['createdAt', 'ASC']], // Urutkan dari yang paling lama ke terbaru
      include: [
        { model: require('../models/User'), as: 'sender', attributes: ['id', 'name'] },
        { model: require('../models/Product'), as: 'product_info', attributes: ['id', 'name', 'price', 'images'] }
      ]
    });

    res.status(200).json({
      messages,
      buyer: conversation.buyer ? {
        id: conversation.buyer.id,
        name: conversation.buyer.name,
        address: conversation.buyer.address || '',
      } : null,
    });

  } catch (error) {
    console.error('Error get messages:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};


//kirim pesan baru (mendukung semua tipe: text, purchase_request, invoice)
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text, type, productId, payment_info, invoice_items, senderName } = req.body;
    const userId = req.user.id;

    if (!text && (!type || type === 'text')) {
      return res.status(400).json({ message: 'Pesan tidak boleh kosong!' });
    }

    // 1. Cek validasi ruang chat dan hak akses
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Ruang chat tidak ditemukan!' });
    }

    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      return res.status(403).json({ message: 'Akses ditolak!' });
    }

    // 2. Simpan pesan baru ke database
    const newMessage = await Message.create({
      conversationId,
      senderId: userId,
      text,
      type: type || 'text',
      productId: productId || null,
      payment_info: payment_info || null,
      invoice_items: invoice_items || null,
    });

    // 3. Ambil info produk jika ada
    let productInfo = null;
    if (newMessage.productId) {
      productInfo = await Product.findByPk(newMessage.productId, {
        attributes: ['id', 'name', 'price', 'images']
      });
    }

    // 4. Update timestamp percakapan
    await Conversation.update(
      { updatedAt: new Date() },
      { where: { id: conversationId } }
    );

    // 5. Response lengkap agar frontend bisa langsung broadcast via Supabase
    res.status(201).json({
      message: 'Pesan terkirim',
      data: {
        id: newMessage.id,
        conversationId: Number(conversationId),
        senderId: userId,
        senderName: senderName || null,
        text: newMessage.text,
        type: newMessage.type,
        productId: newMessage.productId,
        product_info: productInfo,
        payment_info: newMessage.payment_info,
        invoice_items: newMessage.invoice_items,
        createdAt: newMessage.createdAt,
      }
    });

  } catch (error) {
    console.error('Error send message:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// Get semua percakapan user
const getMyConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const User = require('../models/User');

    const conversations = await Conversation.findAll({
      where: {
        [require('sequelize').Op.or]: [
          { buyerId: userId },
          { sellerId: userId }
        ]
      },
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'name', 'profile_picture'] },
        { model: User, as: 'seller', attributes: ['id', 'name', 'profile_picture'] },
        { 
          model: Message, 
          as: 'messages', 
          limit: 1, 
          order: [['createdAt', 'DESC']],
          attributes: ['text', 'createdAt', 'senderId']
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    // Format response agar mudah dipakai frontend
    const formatted = conversations.map(conv => {
      const partner = conv.buyerId === userId ? conv.seller : conv.buyer;
      const lastMessage = conv.messages && conv.messages.length > 0 ? conv.messages[0] : null;
      return {
        id: conv.id,
        partnerId: partner.id,
        partnerName: partner.name,
        partnerAvatar: partner.profile_picture,
        lastMessage: lastMessage ? lastMessage.text : '',
        lastMessageTime: lastMessage ? lastMessage.createdAt : conv.updatedAt,
        lastSenderId: lastMessage ? lastMessage.senderId : null,
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error get conversations:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = { startOrGetChat, getMessages, sendMessage, getMyConversations };