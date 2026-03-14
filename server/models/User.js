const mongoose = require("mongoose");
const { requireEnv } = require("../utils/env");

const USERS_COLLECTION_NAME = requireEnv("USERS_COLLECTION_NAME");

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
