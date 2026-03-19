const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema(
  {
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    template: {
      type: String,
      enum: [
        "software-engineering",
        "business-case-study",
        "study-group",
        "hackathon",
        "blank",
      ],
      default: "blank",
    },
    teamSize: {
      type: Number,
      required: true,
      min: 2,
    },
    requiredTags: {
      type: [String],
      default: [],
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      minlength: 6,
      maxlength: 6,
    },
    status: {
      type: String,
      enum: ["open", "matching", "published"],
      default: "open",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Workspace", workspaceSchema);
