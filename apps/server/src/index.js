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

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);


app.get("/api/health", (_req, res) => {
  const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    db: dbStates[mongoose.connection.readyState] || "unknown",
  });
});

const Response = require("./models/Response");
const { requireAuth } = require("./middleware/auth");

app.post("/api/response", async (req, res) => {
  try {
    console.log("Incoming data:", req.body);

    const newResponse = new Response(req.body);
    await newResponse.save();

    res.json({ message: "Saved successfully!" });
  } catch (err) {
    console.error("Error saving:", err);
    res.status(500).json({ error: "Failed to save" });
  }
});

// GET responses for a workspace (used by instructor page)
app.get("/api/response", async (req, res) => {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required" });
    }
    const responses = await Response.find({ workspaceId });
    res.json({ responses });
  } catch (err) {
    console.error("Error fetching responses:", err);
    res.status(500).json({ error: "Failed to fetch responses" });
  }
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
