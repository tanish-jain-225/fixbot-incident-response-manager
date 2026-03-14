const mongoose = require("mongoose");
const INCIDENTS_COLLECTION_NAME = process.env.INCIDENTS_COLLECTION_NAME;

if (!INCIDENTS_COLLECTION_NAME) {
  throw new Error("Missing required environment variable: INCIDENTS_COLLECTION_NAME");
}

const incidentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    logText: {
      type: String,
      required: true,
    },
    codeSnippet: {
      type: String,
      default: "",
    },
    severity: {
      type: String,
      enum: ["Critical", "Warning", "Minor"],
      default: "Minor",
    },
    rootCause: {
      type: String,
      default: "",
    },
    suggestedFix: {
      type: String,
      default: "",
    },
    explanation: {
      type: String,
      default: "",
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    emailNotificationSent: {
      type: Boolean,
      default: false,
    },
    emailNotificationSentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Incident", incidentSchema, INCIDENTS_COLLECTION_NAME);
