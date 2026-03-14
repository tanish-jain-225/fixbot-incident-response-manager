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

const REQUIRED_ENV_VARS = [
  "JWT_SECRET",
  "MONGO_URI",
  "MONGO_DB_NAME",
  "USERS_COLLECTION_NAME",
  "INCIDENTS_COLLECTION_NAME",
];

function registerMiddlewares() {
  app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));
}

function registerRequestLogger() {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

function registerRoutes() {
  app.use("/api/auth", authRoutes);
  app.use("/api/incidents", incidentRoutes);

  app.get("/", (req, res) => {
    res.json({
      status: "ok",
      service: "fixbot-server",
      port: PORT,
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/health", (req, res) => {
    const mongoStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    res.json({
      status: "healthy",
      service: "fixbot-server",
      database: mongoStatus,
    });
  });
}

function registerErrorHandlers() {
  app.use((req, res) => {
    res.status(404).json({
      error: "Endpoint not found",
      path: req.path,
    });
  });

  app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(err.status || 500).json({
      error: err.message || "Internal server error",
    });
  });
}

registerMiddlewares();
registerRequestLogger();
registerRoutes();
registerErrorHandlers();

function validateRequiredEnv() {
  requireEnvList(REQUIRED_ENV_VARS);
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
    // Serverless requests can hit a cold instance, so init on demand.
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
