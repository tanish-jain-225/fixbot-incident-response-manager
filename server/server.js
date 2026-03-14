const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const incidentRoutes = require("./routes/incidentRoutes");
const authRoutes = require("./routes/authRoutes");
const { requireEnvList } = require("./utils/env");
const { sendServerError } = require("./utils/http");

const app = express();
const PORT = Number(process.env.PORT || 5000);
let mongoConnectionPromise = null;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/incidents", incidentRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "fixbot-server",
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint (explicit)
app.get("/health", (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({
    status: "healthy",
    service: "fixbot-server",
    database: mongoStatus,
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
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

function validateRequiredEnv() {
  requireEnvList([
    "JWT_SECRET",
    "MONGO_URI",
    "MONGO_DB_NAME",
    "USERS_COLLECTION_NAME",
    "INCIDENTS_COLLECTION_NAME",
  ]);
}

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME,
    })
      .then(() => {
        console.log("✅ Connected to MongoDB");
      })
      .catch((err) => {
        mongoConnectionPromise = null;
        throw err;
      });
  }

  await mongoConnectionPromise;
}

module.exports = async (req, res) => {
  try {
    validateRequiredEnv();
    await connectToDatabase();
    return app(req, res);
  } catch (error) {
    console.error("❌ Server initialization error:", error.message);
    return sendServerError(res, "Server initialization error");
  }
};

if (require.main === module) {
  validateRequiredEnv();

  connectToDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`\n🚀 Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err.message);
      process.exit(1);
    });
}
