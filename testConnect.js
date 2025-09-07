const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("todo_db_dev", "postgres", "postgres", {
  host: "127.0.0.1",
  dialect: "postgres",
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connection successful!");
  } catch (error) {
    console.error("❌ Connection failed:", error);
  } finally {
    await sequelize.close();
  }
})();
