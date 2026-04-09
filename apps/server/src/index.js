const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");

require("dotenv").config();

const app = express();

// --------------- Middleware ---------------
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --------------- Routes ---------------
const authRoutes = require("./routes/auth");
const workspaceRoutes = require("./routes/workspaces");
const notificationRoutes = require("./routes/notifications");
const responseRoutes = require("./routes/responses");

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/response", responseRoutes);

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