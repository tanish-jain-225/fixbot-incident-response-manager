const express = require("express");
const router = express.Router();
const { analyzeIncident, getIncidents, getIncidentById, deleteIncident, clearIncidents } = require("../controllers/incidentController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

router.post("/analyze", analyzeIncident);
router.get("/", getIncidents);
router.delete("/", clearIncidents);
router.get("/:id", getIncidentById);
router.delete("/:id", deleteIncident);

module.exports = router;
