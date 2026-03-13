const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const StrategyFactory = require("./services/StrategyFactory");

const app = express();
app.use(express.json());

app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Seeded demo students (no DB risk)
const students = [
  { name: "Alice", availability: ["Mon", "Wed"], skills: ["Java"] },
  { name: "Brian", availability: ["Mon"], skills: ["UI"] },
  { name: "Carla", availability: ["Wed"], skills: ["DB"] },
  { name: "David", availability: ["Mon", "Wed"], skills: ["Beginner"] }
];


mongoose.connect("mongodb://127.0.0.1:27017/gMatch");

app.get("/", (req, res) => {
  // res.send("Welcome to gMatch!");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/demo", (req, res) => {
  res.render("demo.ejs", { teams: null });
});

app.post("/api/generate", (req, res) => {
  const strategyName = req.body.strategy || "WeightedHybridStrategy";
  const strategy = StrategyFactory.create(strategyName);

  const teams = strategy.generate(students, 2);
  res.json({ teams });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
