// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const { startOrGetChat, getMessages, sendMessage, getMyConversations } = require('../controllers/chatController');
const { verifyToken } = require('../middleware/authMiddleware');

// --- Rute Chat (Terproteksi, wajib login sebagai User/Pembeli) ---

// GET /api/chats/ - Daftar semua percakapan user
router.get('/', verifyToken, getMyConversations);

// POST /api/chats/start
// Memulai chat dari halaman produk
router.post('/start', verifyToken, startOrGetChat);

// Dipanggil saat membuka ruang chat
router.get('/:conversationId', verifyToken, getMessages);

// Dipanggil saat mengirim pesan baru
router.post('/:conversationId/message', verifyToken, sendMessage);

module.exports = router;