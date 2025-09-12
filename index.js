// index.js
const app = require("./app");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await sequelize.sync();
    app.listen(PORT, () => {
      console.log(`Server started at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start", err);
  }
})();
