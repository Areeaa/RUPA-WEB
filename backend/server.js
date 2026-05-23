const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
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
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['https://terasrupa.com', 'https://www.terasrupa.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true  // Izinkan cookies dan headers otentikasi
}));

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

// Koneksi Database
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database terhubung dan tabel berhasil disinkronisasi!');
    app.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Terjadi kesalahan database:', error);
  });
