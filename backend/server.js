const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const sequelize = require('./config/database');

// Import Models
const User = require('./models/User');
const Product = require('./models/Product');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const Category = require('./models/Category');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');
const Review = require('./models/Review');
const LicenseApplication = require('./models/LicenseApplication');
const ProductReport = require('./models/ProductReport');
const Donation = require('./models/Donation');
const ReturnRequest = require('./models/ReturnRequest');

// Import Routes
const authRoutes = require('./routes/authRoutes'); 
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const chatRoutes = require('./routes/chatRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const licenseRoutes = require('./routes/licenseRoutes');
const reportRoutes = require('./routes/reportRoutes');
const donationRoutes = require('./routes/donationRoutes');
const returnRoutes = require('./routes/returnRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Token socket wajib dikirim'));
  }

  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    next(new Error('Token socket tidak valid'));
  }
});

app.use(cors());
app.use(express.json());

// Gunakan Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/returns', returnRoutes);


// Route dasar
app.get('/', (req, res) => {
  res.json({ message: 'Selamat datang di API Figma Rupa!' });
});

// ==========================================
// SOCKET.IO - Realtime Chat
// ==========================================
io.on('connection', (socket) => {
  console.log('User terhubung:', socket.id);

  // User bergabung ke ruang chat berdasarkan conversationId
  socket.on('join_room', async (conversationId) => {
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation || ![conversation.buyerId, conversation.sellerId].includes(socket.user.id)) {
      return socket.emit('message_error', { message: 'Akses chat ditolak' });
    }

    socket.join(`chat_${conversationId}`);
    console.log(`User ${socket.id} bergabung ke ruang chat_${conversationId}`);
  });

  // Menerima pesan baru dan broadcast ke ruang chat
  socket.on('send_message', async (data) => {
    const { conversationId, text, senderName, type, productId, payment_info, invoice_items } = data;
    const senderId = socket.user.id;

    try {
      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation || ![conversation.buyerId, conversation.sellerId].includes(senderId)) {
        return socket.emit('message_error', { message: 'Akses chat ditolak' });
      }

      // Simpan pesan ke database
      const newMessage = await Message.create({
        conversationId,
        senderId,
        text,
        type: type || 'text',
        productId: productId || null,
        payment_info: payment_info || null,
        invoice_items: invoice_items || null
      });

      // Update timestamp percakapan
      await Conversation.update(
        { updatedAt: new Date() },
        { where: { id: conversationId } }
      );

      // Ambil info produk jika ada untuk dikirim via socket
      let productInfo = null;
      if (productId || newMessage.productId) {
        productInfo = await Product.findByPk(productId || newMessage.productId, {
          attributes: ['id', 'name', 'price', 'images']
        });
      }

      // Broadcast pesan ke semua user di ruang chat
      io.to(`chat_${conversationId}`).emit('receive_message', {
        id: newMessage.id,
        conversationId,
        senderId,
        senderName,
        text,
        type: newMessage.type,
        productId: newMessage.productId,
        product_info: productInfo,
        payment_info: newMessage.payment_info,
        invoice_items: newMessage.invoice_items,
        createdAt: newMessage.createdAt
      });
    } catch (error) {
      console.error('Error saving socket message:', error);
      socket.emit('message_error', { message: 'Gagal mengirim pesan' });
    }
  });

  // User sedang mengetik
  socket.on('typing', (data) => {
    socket.to(`chat_${data.conversationId}`).emit('user_typing', {
      userId: data.userId,
      isTyping: data.isTyping
    });
  });

  socket.on('leave_room', (conversationId) => {
    socket.leave(`chat_${conversationId}`);
  });

  socket.on('disconnect', () => {
    console.log('User terputus:', socket.id);
  });
});

// Koneksi Database
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database terhubung dan tabel berhasil disinkronisasi!');
    server.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
      console.log(`Socket.IO aktif dan siap menerima koneksi realtime`);
    });
  })
  .catch((error) => {
    console.error('Terjadi kesalahan database:', error);
  });
