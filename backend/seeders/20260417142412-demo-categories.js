'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('categories', [
      { name: 'Kuliner' },
      { name: 'Fashion' },
      { name: 'Kerajinan' },
      { name: 'Elektronik' },
      { name: 'Jasa & Pendidikan' }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('categories', null, {});
  }
};