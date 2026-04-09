const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Form = require("../models/Form");
const Workspace = require("../models/Workspace");
const { requireAuth } = require("../middleware/auth");

// GET form for a workspace
router.get("/:workspaceId", requireAuth, async (req, res) => {
  try {
    const { workspaceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({ message: "Invalid workspace id" });
    }

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const form = await Form.findOne({ workspaceId });

    return res.json({
      form: form || { workspaceId, questions: [] },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load form",
      error: error.message,
    });
  }
});

// PUT save form for a workspace
router.put("/:workspaceId", requireAuth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { questions } = req.body;

    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({ message: "Invalid workspace id" });
    }

    if (!Array.isArray(questions)) {
      return res.status(400).json({ message: "Questions must be an array" });
    }

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const cleanedQuestions = questions
      .map((question, index) => ({
        id: String(question.id || `q${index + 1}`),
        type: ["multiple-choice", "availability-grid", "skill-tag"].includes(question.type)
          ? question.type
          : "multiple-choice",
        label: String(question.label || "").trim(),
        tag: String(question.tag || "").trim(),
        options: Array.isArray(question.options)
          ? question.options.map((option) => String(option).trim()).filter(Boolean)
          : [],
      }))
      .filter((question) => question.label);

    const form = await Form.findOneAndUpdate(
      { workspaceId },
      { workspaceId, questions: cleanedQuestions },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      message: "Form saved successfully",
      form,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to save form",
      error: error.message,
    });
  }
});

module.exports = router;