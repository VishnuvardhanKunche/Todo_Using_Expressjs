module.exports = (sequelize, DataTypes) => {
  const Todo = sequelize.define(
    "Todo",
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "Todo title is required" },
          len: { args: [5, 255], msg: "Title must be at least 5 characters" },
        },
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notNull: { msg: "Due date is required" },
        },
      },
      completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "Todos",
    }
  );

  Todo.associate = (models) => {
    Todo.belongsTo(models.User, { foreignKey: "userId" });
  };

  return Todo;
};
