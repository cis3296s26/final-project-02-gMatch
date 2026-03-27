const express = require("express");
const router = express.Router();
const Workspace = require("../models/Workspace");
const User = require("../models/User");
const crypto = require("crypto");

/** Generate a random 6-char uppercase alphanumeric invite code */
function generateInviteCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

/**
 * POST /api/workspaces
 * Create a new workspace. Requires organizerEmail, name, teamSize.
 */
router.post("/", async (req, res) => {
  try {
    const { organizerEmail, name, teamSize, template, requiredTags } = req.body;

    if (!organizerEmail || !name || !teamSize) {
      return res.status(400).json({ error: "organizerEmail, name, and teamSize are required" });
    }

    const organizer = await User.findOne({ email: organizerEmail });
    if (!organizer) {
      return res.status(404).json({ error: "Organizer not found" });
    }

    // Generate a unique invite code (retry if collision)
    let inviteCode;
    let exists = true;
    while (exists) {
      inviteCode = generateInviteCode();
      exists = await Workspace.findOne({ inviteCode });
    }

    const workspace = await Workspace.create({
      organizerId: organizer._id,
      name,
      teamSize: parseInt(teamSize),
      template: template || "blank",
      requiredTags: requiredTags || [],
      inviteCode,
    });

    res.status(201).json(workspace);
  } catch (err) {
    console.error("[Workspaces] Create error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/workspaces?organizerEmail=...
 * List all workspaces for an organizer.
 */
router.get("/", async (req, res) => {
  try {
    const { organizerEmail } = req.query;

    if (!organizerEmail) {
      return res.status(400).json({ error: "organizerEmail query param is required" });
    }

    const organizer = await User.findOne({ email: organizerEmail });
    if (!organizer) {
      return res.status(404).json({ error: "Organizer not found" });
    }

    const workspaces = await Workspace.find({ organizerId: organizer._id })
      .sort({ createdAt: -1 });

    res.json(workspaces);
  } catch (err) {
    console.error("[Workspaces] List error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/workspaces/participant?email=...
 * List workspaces a participant has joined.
 */
router.get("/participant", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "email query param is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const workspaces = await Workspace.find({ participants: user._id })
      .populate("organizerId", "name email")
      .sort({ createdAt: -1 });

    res.json(workspaces);
  } catch (err) {
    console.error("[Workspaces] Participant list error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/workspaces/:id
 * Get a single workspace by ID, with populated participants.
 */
router.get("/:id", async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate("organizerId", "name email avatar")
      .populate("participants", "name email avatar");

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    res.json(workspace);
  } catch (err) {
    console.error("[Workspaces] Get error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/workspaces/:id
 * Update workspace fields (name, teamSize, template, requiredTags, status).
 */
router.patch("/:id", async (req, res) => {
  try {
    const { name, teamSize, template, requiredTags, status } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (teamSize !== undefined) updates.teamSize = parseInt(teamSize);
    if (template !== undefined) updates.template = template;
    if (requiredTags !== undefined) updates.requiredTags = requiredTags;
    if (status !== undefined) updates.status = status;

    const workspace = await Workspace.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    res.json(workspace);
  } catch (err) {
    console.error("[Workspaces] Update error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/workspaces/:id
 * Delete a workspace.
 */
router.delete("/:id", async (req, res) => {
  try {
    const workspace = await Workspace.findByIdAndDelete(req.params.id);

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    res.json({ message: "Workspace deleted" });
  } catch (err) {
    console.error("[Workspaces] Delete error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/workspaces/join
 * Join a workspace using an invite code.
 */
router.post("/join", async (req, res) => {
  try {
    const { inviteCode, participantEmail } = req.body;

    if (!inviteCode || !participantEmail) {
      return res.status(400).json({ error: "inviteCode and participantEmail are required" });
    }

    const user = await User.findOne({ email: participantEmail });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const workspace = await Workspace.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!workspace) {
      return res.status(404).json({ error: "Invalid invite code" });
    }

    if (workspace.status !== "open") {
      return res.status(400).json({ error: "This workspace is no longer accepting participants" });
    }

    // Check if already joined
    if (workspace.participants.includes(user._id)) {
      return res.status(400).json({ error: "You have already joined this workspace" });
    }

    workspace.participants.push(user._id);
    await workspace.save();

    res.json(workspace);
  } catch (err) {
    console.error("[Workspaces] Join error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
