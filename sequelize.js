// sequelize.js
const { Sequelize } = require("sequelize");

const isTest = process.env.NODE_ENV === "test";

const sequelize = isTest
  ? new Sequelize("sqlite::memory:", { logging: false })
  : new Sequelize({
      dialect: "sqlite",
      storage: "./todo.sqlite",
      logging: false,
    });

module.exports = sequelize;
