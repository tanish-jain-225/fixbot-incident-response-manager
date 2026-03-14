const Incident = require("../models/Incident");
const { analyzeWithML } = require("../services/mlService");
const { sendIncidentEmail } = require("../services/emailService");

function normalizeSeverity(severity) {
  const value = String(severity || "").toLowerCase();
  if (value === "critical") return "Critical";
  if (value === "warning") return "Warning";
  return "Minor";
}

async function analyzeIncident(req, res) {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const { logText, codeSnippet } = req.body;

    // Validation
    if (!logText || typeof logText !== "string" || logText.trim() === "") {
      return res.status(400).json({ error: "logText is required and must be non-empty" });
    }

    if (logText.length > 50000) {
      return res.status(400).json({ error: "logText exceeds maximum length of 50000 characters" });
    }

    if (codeSnippet && codeSnippet.length > 50000) {
      return res.status(400).json({ error: "codeSnippet exceeds maximum length of 50000 characters" });
    }

    const analysis = await analyzeWithML(logText, codeSnippet || "");

    const incident = await Incident.create({
      userId,
      userEmail,
      logText,
      codeSnippet: codeSnippet || "",
      severity: normalizeSeverity(analysis.severity),
      rootCause: analysis.rootCause,
      suggestedFix: analysis.suggestedFix,
      explanation: analysis.explanation,
      confidenceScore: analysis.confidenceScore,
    });

    let emailSent = false;
    try {
      emailSent = await sendIncidentEmail({
        toEmail: userEmail,
        incident,
      });

      if (emailSent) {
        incident.emailNotificationSent = true;
        incident.emailNotificationSentAt = new Date();
        await incident.save();
      }
    } catch (emailError) {
      console.error("Incident email notification failed:", emailError.message);
    }

    res.status(201).json({
      ...incident.toObject(),
      userEmail: incident.userEmail || userEmail,
      emailNotificationSent: emailSent,
    });
  } catch (error) {
    console.error("Analyze incident error:", error.message);
    
    if (error.message.includes("RESINIX_API_KEY") || error.message.includes("GEMINI_API_KEY")) {
      return res.status(500).json({ error: "ML Service not configured properly" });
    }
    if (error.message.includes("rate limit exceeded")) {
      return res.status(429).json({ error: "AI rate limit exceeded. Please try again later." });
    }
    if (error.message.includes("authentication failed")) {
      return res.status(500).json({ error: "ML Service authentication error" });
    }
    if (error.message.includes("timed out")) {
      return res.status(504).json({ error: "ML Service request timed out" });
    }
    if (error.message.includes("invalid AI response")) {
      return res.status(502).json({ error: "ML Service returned an invalid response" });
    }
    if (error.message.includes("not running") || error.message.includes("Cannot reach") || error.message.includes("connect")) {
      return res.status(503).json({ error: "ML Service is unavailable" });
    }

    res.status(500).json({ error: "Failed to analyze incident" });
  }
}

async function getIncidents(req, res) {
  try {
    const userEmail = String(req.user.email || "").toLowerCase().trim();
    const { severity, limit = 50, skip = 0 } = req.query;

    let query = { userEmail };
    if (severity) {
      query.severity = severity;
    }

    const incidents = await Incident.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(Math.min(parseInt(limit) || 50, 100))
      .skip(parseInt(skip) || 0);

    const incidentsWithEmail = incidents.map((incident) => ({
      ...incident.toObject(),
      userEmail: incident.userEmail || req.user.email,
    }));

    const total = await Incident.countDocuments(query);

    res.json({
      data: incidentsWithEmail,
      total,
      limit: Math.min(parseInt(limit) || 50, 100),
      skip: parseInt(skip) || 0,
    });
  } catch (error) {
    console.error("Get incidents error:", error.message);
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
}

async function getIncidentById(req, res) {
  try {
    const userEmail = String(req.user.email || "").toLowerCase().trim();
    const { id } = req.params;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid incident ID format" });
    }

    const incident = await Incident.findOne({ _id: id, userEmail });

    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    res.json({
      ...incident.toObject(),
      userEmail: incident.userEmail || req.user.email,
    });
  } catch (error) {
    console.error("Get incident by ID error:", error.message);
    res.status(500).json({ error: "Failed to fetch incident" });
  }
}

async function deleteIncident(req, res) {
  try {
    const userEmail = String(req.user.email || "").toLowerCase().trim();
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid incident ID format" });
    }

    const incident = await Incident.findOneAndDelete({ _id: id, userEmail });

    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    res.json({
      message: "Incident deleted successfully",
      incident: {
        ...incident.toObject(),
        userEmail: incident.userEmail || req.user.email,
      },
    });
  } catch (error) {
    console.error("Delete incident error:", error.message);
    res.status(500).json({ error: "Failed to delete incident" });
  }
}

async function clearIncidents(req, res) {
  try {
    const userEmail = String(req.user.email || "").toLowerCase().trim();

    const result = await Incident.deleteMany({ userEmail });

    res.json({
      message: "Incident history cleared successfully",
      deletedCount: result.deletedCount || 0,
      userEmail,
    });
  } catch (error) {
    console.error("Clear incidents error:", error.message);
    res.status(500).json({ error: "Failed to clear incident history" });
  }
}

module.exports = { analyzeIncident, getIncidents, getIncidentById, deleteIncident, clearIncidents };
