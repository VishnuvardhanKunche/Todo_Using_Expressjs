'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }


    static addTodo({ title, dueDate}) {
      return this.create({ title: title, dueDate: dueDate, completed: false })
    }

    static getTodos() {
      return this.findAll()
    }
  
    static async overdue() {
  return this.findAll({
    where: {
      dueDate: { [Sequelize.Op.lt]: new Date() },
      completed: false
    },
    order: [["dueDate", "ASC"]]
  });
}

static async dueToday() {
  return this.findAll({
    where: {
      dueDate: { [Sequelize.Op.eq]: new Date() },
      completed: false
    },
    order: [["dueDate", "ASC"]]
  });
}

static async dueLater() {
  return this.findAll({
    where: {
      dueDate: { [Sequelize.Op.gt]: new Date() },
      completed: false
    },
    order: [["dueDate", "ASC"]]
  });
}

    markAsCompleted() {
      return this.update({ completed: true })
    }
  }
  Todo.init({
    title: DataTypes.STRING,
    dueDate: DataTypes.DATEONLY,
    completed: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Todo',
  });
  return Todo;
};