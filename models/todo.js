// models/todo.js
const { DataTypes, Model } = require("sequelize");
const sequelize = require("../sequelize");

class Todo extends Model {
  static addTodo({ title, dueDate }) {
    // ensure null for blank dueDate
    const dd = dueDate ? dueDate : null;
    return this.create({ title, dueDate: dd, completed: false });
  }

  // new method: accepts boolean and saves
  async setCompletionStatus(isCompleted) {
    this.completed = !!isCompleted;
    await this.save();
    return this;
  }
}

Todo.init(
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "Todo",
    tableName: "Todos",
  }
);

module.exports = Todo;
