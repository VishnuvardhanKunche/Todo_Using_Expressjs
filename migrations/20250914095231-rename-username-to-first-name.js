'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Rename username column to first_name in Users table
    await queryInterface.renameColumn('Users', 'username', 'first_name');
  },

  async down(queryInterface, Sequelize) {
    // Reverse the migration - rename first_name back to username
    await queryInterface.renameColumn('Users', 'first_name', 'username');
  }
};