// models/index.js
const sequelize = require("../sequelize");
const Todo = require("./todo");

module.exports = {
  sequelize,
  Todo,
};
