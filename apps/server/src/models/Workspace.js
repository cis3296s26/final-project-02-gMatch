const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema(
  {
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    teamSize: {
      type: Number,
      required: true,
      min: 2
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    //store generated teams inside the workspace
    teams: {
      type: [
        {
          members: [
            {
              name: { type: String, required: true },
              availability: [{ type: String }],
              skills: [{ type: String }]
            }
          ]
        }
      ],
      default: []
    },
    status: {
      type: String,
      enum: ["open", "matching", "published"],
      default: "open"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Workspace", workspaceSchema);