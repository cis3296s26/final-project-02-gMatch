const express = require("express");
const cors = require("cors");

require("dotenv").config();

const app = express();

// --------------- Middleware ---------------
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------- Routes ---------------
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// --------------- Start ---------------
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`[gMatch Server] Running on http://localhost:${PORT}`);
});

module.exports = app;
