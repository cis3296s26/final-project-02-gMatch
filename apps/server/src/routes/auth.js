const express = require("express");
const router = express.Router();
const User = require("../models/User");

/**
 * POST /api/auth/login
 * Called by NextAuth signIn callback to sync user to MongoDB.
 * Finds or creates a User document.
 */
router.post("/login", async (req, res) => {
  try {
    const { name, email, avatar, oauthProvider, oauthId } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        avatar: avatar || "",
        oauthProvider,
        oauthId,
      });
    } else {
      // Update fields that may have changed
      if (name) user.name = name;
      if (avatar) user.avatar = avatar;
      if (oauthProvider) user.oauthProvider = oauthProvider;
      if (oauthId) user.oauthId = oauthId;
      await user.save();
    }

    res.json(user);
  } catch (err) {
    console.error("[Auth] Login error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/auth/me?email=...
 * Returns the user document for the given email.
 */
router.get("/me", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("[Auth] Me error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/auth/role
 * Updates the user's role after first login.
 */
router.patch("/role", async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: "Email and role are required" });
    }

    if (!["organizer", "participant"].includes(role)) {
      return res.status(400).json({ error: "Role must be organizer or participant" });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("[Auth] Role update error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/auth/profile
 * Updates name, bio, and portfolioUrls for the authenticated user.
 */
router.patch("/profile", async (req, res) => {
  try {
    const { email, name, bio, portfolioUrls } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (bio !== undefined) update.bio = bio.trim().slice(0, 160);
    if (Array.isArray(portfolioUrls)) {
      update.portfolioUrls = portfolioUrls
        .map((u) => u.trim())
        .filter((u) => u.length > 0);
    }

    const user = await User.findOneAndUpdate(
      { email },
      update,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("[Auth] Profile update error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;