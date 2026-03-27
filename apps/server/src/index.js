const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

require("dotenv").config();

const app = express();

// --------------- Middleware ---------------
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------- Routes ---------------
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const workspaceRoutes = require("./routes/workspaces");
app.use("/api/workspaces", workspaceRoutes);

app.get("/api/health", (_req, res) => {
  const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    db: dbStates[mongoose.connection.readyState] || "unknown",
  });
});

// --------------- Start ---------------
const PORT = process.env.PORT || 5001;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[gMatch Server] Running on http://localhost:${PORT}`);
  });
}

start();

module.exports = app;
