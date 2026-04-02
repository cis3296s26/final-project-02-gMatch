const express = require("express");
const Workspace = require("../models/Workspace");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");

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
router.get("/", requireAuth, async (_req, res) => {
  try {
    const workspaces = await Workspace.find({
      organizerId: _req.user.id,
    }).sort({ createdAt: 1 });
    res.json({ workspaces });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load workspaces",
      error: error.message
    });
  }
});

// POST create workspace
router.post("/", requireAuth, async (req, res) => {
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
      organizerId: req.user.id,
      name: name.trim(),
      teamSize: Number(teamSize),
      inviteCode,
      teams: []
    });

    return res.status(201).json({ workspace });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create workspace",
      error: error.message
    });
  }
});

// POST join workspace by invite code
router.post("/join", requireAuth, async (req, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode || !inviteCode.trim()) {
      return res.status(400).json({ message: "Invite code is required" });
    }

    const workspace = await Workspace.findOne({ inviteCode: inviteCode.trim() });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (!workspace.participants) workspace.participants = [];

    // Check if participant is already in a team
    const alreadyJoined = workspace.participants.some(participant =>
      participant === req.user.id
    );

    if (alreadyJoined) {
      return res.status(400).json({ message: "You have already joined this workspace" });
    }

    // Add participant to the workspace
    workspace.participants.push(req.user.id);

    await workspace.save();

    return res.json({ message: "Joined workspace successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to join workspace",
      error: error.message
    });
  }
});

// get workspaces for a specific participant
router.get("/participant", requireAuth, async (_req, res) => {
  try {
    const workspaces = await Workspace.find({
      participants: { $in: [_req.user.id] },
    }).sort({ createdAt: 1 });
    
    res.json({ workspaces });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load workspaces",
      error: error.message
    });
  }
});

// GET single workspace by ID
router.get("/:id", async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    return res.json(workspace);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch workspace",
      error: error.message
    });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { name, teamSize } = req.body;
    const update = {};
    if (name) update.name = name.trim();
    if (teamSize) update.teamSize = Number(teamSize);

    const workspace = await Workspace.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    return res.json(workspace);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update workspace",
      error: error.message
    });
  }
});

// DELETE workspace
router.delete("/:id", async (req, res) => {
  try {
    const workspace = await Workspace.findByIdAndDelete(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    return res.json({ message: "Workspace deleted" });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete workspace",
      error: error.message
    });
  }
});

//save teams to a workspace
router.put("/:workspaceId/teams", async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { teams } = req.body;

    if (!Array.isArray(teams)) {
      return res.status(400).json({ message: "Teams must be an array" });
    }

    const formattedTeams = teams.map((team) => ({
      members: Array.isArray(team) ? team : team.members || []
    }));

    const updatedWorkspace = await Workspace.findByIdAndUpdate(
      workspaceId,
      { teams: formattedTeams },
      { new: true, runValidators: true }
    );

    if (!updatedWorkspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    return res.json({
      message: "Teams saved successfully",
      workspace: updatedWorkspace
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to save teams",
      error: error.message
    });
  }
});

module.exports = router;
