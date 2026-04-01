const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["organizer", "participant"],
      default: null,
    },
    bio: {
      type: String,
      default: "",
      maxlength: 160,
      trim: true,
    },
    portfolioUrls: {
      type: [String],
      default: [],
    },
    oauthProvider: {
      type: String,
      enum: ["google", "github"],
    },
    oauthId: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);