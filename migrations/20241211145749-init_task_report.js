"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("TaskReports", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      content: {
        type: Sequelize.TEXT,
        defaultValue: "",
      },
      progress: {
        type: Sequelize.INTEGER,
      },
      fileIds: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      taskId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      isAssess: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
