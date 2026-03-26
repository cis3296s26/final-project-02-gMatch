const express = require("express");
const Workspace = require("../models/Workspace");

const router = express.Router();

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomInviteCode() {
  let code = "";

  for (let i = 0; i < 6; i += 1) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }

  return code;
}

async function generateUniqueInviteCode() {
  let code = randomInviteCode();
  let exists = await Workspace.findOne({ inviteCode: code });

  while (exists) {
    code = randomInviteCode();
    exists = await Workspace.findOne({ inviteCode: code });
  }

  return code;
}

// GET all workspaces
router.get("/", async (req, res) => {
  try {
    const workspaces = await Workspace.find().sort({ createdAt: 1 });
    res.json({ workspaces });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load workspaces",
      error: error.message
    });
  }
});

// POST create workspace
router.post("/", async (req, res) => {
  try {
    const { name, teamSize } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Workspace name is required" });
    }

    if (!teamSize || Number(teamSize) < 2) {
      return res
        .status(400)
        .json({ message: "Team size must be at least 2" });
    }

    const inviteCode = await generateUniqueInviteCode();

    const workspace = await Workspace.create({
      organizerId: "000000000000000000000000",
      name: name.trim(),
      teamSize: Number(teamSize),
      inviteCode
    });

    return res.status(201).json({ workspace });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create workspace",
      error: error.message
    });
  }
});

module.exports = router;