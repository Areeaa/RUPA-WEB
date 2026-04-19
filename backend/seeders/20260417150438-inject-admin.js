'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Enkripsi password sebelum dimasukkan ke database
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // 2. Masukkan data ke tabel users
    return queryInterface.bulkInsert('users', [
      {
        name: 'Admin Rupa',
        email: 'admin@rupa.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    // Menghapus data admin jika seeder di-undo
    return queryInterface.bulkDelete('users', { email: 'admin@rupa.com' }, {});
  }
};