const express = require("express");
const cors = require("cors");
require("dotenv").config();

const analyzeRoute = require("./routes/analyze");
const aiModel   = require("./config/aiModel");
const { sendServerError } = require("./utils/http");

const app = express();
const PORT = Number(process.env.PORT || 8000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/analyze", analyzeRoute);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "fixbot-ml-server",
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint (explicit)
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "fixbot-ml-server",
    ai: aiModel.getHealthSummary(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  return sendServerError(res, err.message || "Internal server error");
});

module.exports = app;

if (require.main === module) {
  // Start server
  app.listen(PORT, () => {
    console.log(`\n🚀 ML Server running on port ${PORT}`);
    console.log(`🤖 Primary  : ${aiModel.primary.name}  (${aiModel.primary.provider})`);
    console.log(`🔁 Fallback : ${aiModel.fallback.name} (${aiModel.fallback.provider})`);
  });
}
