const mongoose = require("mongoose");

/**
 * Connect to MongoDB Atlas.
 * Reads MONGODB_URI from environment variables.
 */
async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error("[MongoDB] MONGODB_URI is not defined in environment variables");
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log(`[MongoDB] Connected to ${mongoose.connection.name}`);
  } catch (err) {
    console.error("[MongoDB] Connection error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
