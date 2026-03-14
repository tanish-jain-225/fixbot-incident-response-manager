const mongoose = require("mongoose");
const USERS_COLLECTION_NAME = process.env.USERS_COLLECTION_NAME;

if (!USERS_COLLECTION_NAME) {
  throw new Error("Missing required environment variable: USERS_COLLECTION_NAME");
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema, USERS_COLLECTION_NAME);
