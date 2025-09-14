const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: "First name is required" },
        notEmpty: { msg: "First name cannot be empty" },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notNull: { msg: "Email is required" },
        notEmpty: { msg: "Email cannot be empty" },
        isEmail: { msg: "Must be a valid email address" },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: "Password is required" },
        notEmpty: { msg: "Password cannot be empty" },
        len: { args: [6, 255], msg: "Password must be at least 6 characters long" },
      },
    },
  });

  User.beforeCreate(async (user, options) => {
    const hash = await bcrypt.hash(user.password, 10);
    user.password = hash;
  });

  User.associate = (models) => {
    User.hasMany(models.Todo, { foreignKey: "userId" });
  };

  return User;
};