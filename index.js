const app = require("./app");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 3000;

sequelize.sync().then(() => {
  console.log("Database synced!");
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}).catch(err => console.error("DB sync error:", err));
