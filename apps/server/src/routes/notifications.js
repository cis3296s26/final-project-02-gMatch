const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const { requireAuth } = require("../middleware/auth");

// GET /api/notifications — fetch all notifications for the current user
router.get("/", requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: new mongoose.Types.ObjectId(req.user.id),
    }).sort({ createdAt: -1 });

    return res.json({ notifications });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// PATCH /api/notifications/:id/read — mark one notification as read
router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: new mongoose.Types.ObjectId(req.user.id) },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    return res.json({ notification });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update notification" });
  }
});

// PATCH /api/notifications/read-all — mark all as read for current user
router.patch("/read-all", requireAuth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: new mongoose.Types.ObjectId(req.user.id), read: false },
      { read: true }
    );
    return res.json({ message: "All notifications marked as read" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update notifications" });
  }
});

module.exports = router;