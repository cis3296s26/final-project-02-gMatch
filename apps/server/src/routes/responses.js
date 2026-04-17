const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Response = require("../models/Response");
const Workspace = require("../models/Workspace");
const Notification = require("../models/Notification");
const { requireAuth } = require("../middleware/auth");

// helpers

/**
 * Convert an array of availability entries from the survey into a
 * structured availabilityGrid map:
 *   { "Monday": ["09:00-10:00", "14:00-15:00"], "Tuesday": [...] }
 *
 * Each entry can be:
 *   { day, startTime, endTime }  (object from the survey UI)
 *   "Monday 09:00-10:00"         (legacy string)
 */
function buildAvailabilityGrid(availabilityAnswer) {
  if (!Array.isArray(availabilityAnswer)) return {};

  const grid = {};

  for (const entry of availabilityAnswer) {
    if (typeof entry === "string") {
      // "Monday 09:00-10:00"
      const parts = entry.split(" ");
      if (parts.length >= 2) {
        const day = parts[0];
        const slot = parts.slice(1).join(" ");
        if (!grid[day]) grid[day] = [];
        if (!grid[day].includes(slot)) grid[day].push(slot);
      }
    } else if (entry && entry.day && entry.startTime && entry.endTime) {
      const { day, startTime, endTime } = entry;
      const slot = `${startTime}-${endTime}`;
      if (!grid[day]) grid[day] = [];
      if (!grid[day].includes(slot)) grid[day].push(slot);
    }
  }

  return grid;
}

/**
 * Extract a plain string ID from a participantId that may be either
 * a raw ObjectId or a populated User object.
 */
function toIdString(participantId) {
  if (!participantId) return "";
  if (typeof participantId === "object" && participantId._id) {
    return String(participantId._id);
  }
  return String(participantId);
}

function normalizeEmailList(list = []) {
  return list
    .filter(Boolean)
    .map((email) => String(email).trim().toLowerCase())
    .filter((email, index, arr) => arr.indexOf(email) === index);
}

function detectConflicts(responses) {
  const conflicts = [];

  for (let i = 0; i < responses.length; i++) {
    for (let j = i + 1; j < responses.length; j++) {
      const a = responses[i];
      const b = responses[j];

      const gridA = a.availabilityGrid || {};
      const gridB = b.availabilityGrid || {};

      let hasOverlap = false;

      outer: for (const day of Object.keys(gridA)) {
        if (gridB[day]) {
          for (const slot of gridA[day]) {
            if (gridB[day].includes(slot)) {
              hasOverlap = true;
              break outer;
            }
          }
        }
      }

      if (!hasOverlap) {
        conflicts.push({
          participantA: toIdString(a.participantId),
          participantAName: a.participantId?.name || null,
          participantB: toIdString(b.participantId),
          participantBName: b.participantId?.name || null,
        });
      }
    }
  }

  return conflicts;
}

// POST /api/response
// Save a survey response, populate availabilityGrid, run conflict detection,
// and create notifications for the workspace organizer + affected participants.

router.post("/", requireAuth, async (req, res) => {
  try {
    const { workspaceId, answers, whitelistEmails, blacklistEmails } = req.body;

    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required" });
    }

    // Find the availability answer from the submitted answers array
    const availAnswer = Array.isArray(answers)
      ? answers.find((a) => a.questionId === "availability")
      : null;

    const availabilityGrid = buildAvailabilityGrid(availAnswer?.value);

    // Upsert: one response per participant per workspace
    const responseDoc = await Response.findOneAndUpdate(
      {
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
        participantId: new mongoose.Types.ObjectId(req.user.id),
      },
      {
        workspaceId,
        participantId: req.user.id,
        answers: Array.isArray(answers) ? answers : [],
        availabilityGrid,
        whitelistEmails: normalizeEmailList(whitelistEmails),
        blacklistEmails: normalizeEmailList(blacklistEmails),
      },
      { upsert: true, new: true }
    );

    // Conflict detection
    const allResponses = await Response.find({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
    });

    const conflicts = detectConflicts(allResponses);

    // Notify the workspace organiser about any new conflicts
    const workspace = await Workspace.findById(workspaceId);
    if (workspace && conflicts.length > 0) {
      await Notification.create({
        userId: workspace.organizerId,
        message: `⚠️ ${conflicts.length} scheduling conflict(s) detected in workspace "${workspace.name}". Check the Availability Grid.`,
      });

      // Notify each conflicting participant pair
      for (const { participantA, participantB } of conflicts) {
        await Notification.create({
          userId: participantA,
          message: `⚠️ Your availability in "${workspace.name}" conflicts with another participant. Update your survey to enable better team matching.`,
        });
        await Notification.create({
          userId: participantB,
          message: `⚠️ Your availability in "${workspace.name}" conflicts with another participant. Update your survey to enable better team matching.`,
        });
      }
    }

    return res.json({
      message: "Saved successfully!",
      response: responseDoc,
      conflictsDetected: conflicts.length,
    });
  } catch (err) {
    console.error("Error saving response:", err);
    return res.status(500).json({ error: "Failed to save response" });
  }
});

// GET /api/response?workspaceId=... 
// Fetch all survey responses for a workspace (used by instructor + availability grid).

router.get("/", async (req, res) => {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required" });
    }

    const responses = await Response.find({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
    }).populate("participantId", "name email avatar");

    // Include conflict summary
    const conflicts = detectConflicts(responses);

    return res.json({ responses, conflictsDetected: conflicts.length, conflicts });
  } catch (err) {
    console.error("Error fetching responses:", err);
    return res.status(500).json({ error: "Failed to fetch responses" });
  }
});

// GET /api/response/my?workspaceId=...
// Fetch the authenticated participant's own response for a workspace.

router.get("/my", requireAuth, async (req, res) => {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required" });
    }

    const response = await Response.findOne({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      participantId: new mongoose.Types.ObjectId(req.user.id),
    });

    return res.json({ response: response || null });
  } catch (err) {
    console.error("Error fetching own response:", err);
    return res.status(500).json({ error: "Failed to fetch response" });
  }
});

module.exports = router;