// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const { startOrGetChat, getMessages, sendMessage, getMyConversations } = require('../controllers/chatController');
const { verifyToken, isUserOnly } = require('../middleware/authMiddleware');

// --- Rute Chat (Terproteksi, wajib login sebagai User/Pembeli) ---

// GET /api/chats/ - Daftar semua percakapan user
router.get('/', verifyToken, isUserOnly, getMyConversations);

// POST /api/chats/start
// Memulai chat dari halaman produk
router.post('/start', verifyToken, isUserOnly, startOrGetChat);

// Dipanggil saat membuka ruang chat
router.get('/:conversationId', verifyToken, isUserOnly, getMessages);

// Dipanggil saat mengirim pesan baru
router.post('/:conversationId/message', verifyToken, isUserOnly, sendMessage);

module.exports = router;