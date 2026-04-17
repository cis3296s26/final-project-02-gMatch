const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const authRoutes = require("./routes/auth");
const workspaceRoutes = require("./routes/workspaces");
const notificationRoutes = require("./routes/notifications");
const responseRoutes = require("./routes/responses");
const formRoutes = require("./routes/forms");

const app = express();

// --------------- Middleware ---------------
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --------------- Routes ---------------
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/response", responseRoutes);
app.use("/api/forms", formRoutes);

app.get("/api/health", (_req, res) => {
  const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    db: dbStates[mongoose.connection.readyState] || "unknown",
  });
});

module.exports = app;
