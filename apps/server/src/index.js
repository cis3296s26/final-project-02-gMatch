const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5001;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[gMatch Server] Running on http://localhost:${PORT}`);
  });
}

start();

module.exports = app;
