const Incident = require("../models/Incident");
const { analyzeWithML } = require("../services/mlService");
const { sendIncidentEmail } = require("../services/emailService");
const { sendError, sendServerError } = require("../utils/http");
const { mapMlServiceError } = require("../utils/mlErrors");
const { normalizeEmail, isValidObjectId, parsePagination } = require("../utils/request");

const MAX_INCIDENT_INPUT_LENGTH = 50000;

function validateAnalyzePayload(logText, codeSnippet) {
  if (!logText || typeof logText !== "string" || logText.trim() === "") {
    return "logText is required and must be non-empty";
  }

  if (logText.length > MAX_INCIDENT_INPUT_LENGTH) {
    return "logText exceeds maximum length of 50000 characters";
  }

  if (codeSnippet && codeSnippet.length > MAX_INCIDENT_INPUT_LENGTH) {
    return "codeSnippet exceeds maximum length of 50000 characters";
  }

  return null;
}

function toIncidentResponse(incident, fallbackEmail) {
  return {
    ...incident.toObject(),
    userEmail: incident.userEmail || fallbackEmail,
  };
}

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

    const payloadError = validateAnalyzePayload(logText, codeSnippet);
    if (payloadError) {
      return sendError(res, 400, payloadError);
    }

    // Ask ML service for analysis before persisting.
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

    return res.status(201).json({
      ...toIncidentResponse(incident, userEmail),
      emailNotificationSent: emailSent,
    });
  } catch (error) {
    console.error("Analyze incident error:", error.message);

    const mappedMlError = mapMlServiceError(error);
    if (mappedMlError) {
      return sendError(res, mappedMlError.statusCode, mappedMlError.message);
    }

    return sendServerError(res, "Failed to analyze incident");
  }
}

async function getIncidents(req, res) {
  try {
    const userEmail = normalizeEmail(req.user.email);
    const { severity } = req.query;
    const { limit, skip } = parsePagination(req.query, {
      defaultLimit: 50,
      maxLimit: 100,
    });

    const query = { userEmail };
    if (severity) {
      query.severity = normalizeSeverity(severity);
    }

    const incidents = await Incident.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .skip(skip);

    const incidentsWithEmail = incidents.map((incident) => toIncidentResponse(incident, req.user.email));

    const total = await Incident.countDocuments(query);

    return res.json({
      data: incidentsWithEmail,
      total,
      limit,
      skip,
    });
  } catch (error) {
    console.error("Get incidents error:", error.message);
    return sendServerError(res, "Failed to fetch incidents");
  }
}

async function getIncidentById(req, res) {
  try {
    const userEmail = normalizeEmail(req.user.email);
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid incident ID format");
    }

    const incident = await Incident.findOne({ _id: id, userEmail });

    if (!incident) {
      return sendError(res, 404, "Incident not found");
    }

    return res.json(toIncidentResponse(incident, req.user.email));
  } catch (error) {
    console.error("Get incident by ID error:", error.message);
    return sendServerError(res, "Failed to fetch incident");
  }
}

async function deleteIncident(req, res) {
  try {
    const userEmail = normalizeEmail(req.user.email);
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid incident ID format");
    }

    const incident = await Incident.findOneAndDelete({ _id: id, userEmail });

    if (!incident) {
      return sendError(res, 404, "Incident not found");
    }

    return res.json({
      message: "Incident deleted successfully",
      incident: toIncidentResponse(incident, req.user.email),
    });
  } catch (error) {
    console.error("Delete incident error:", error.message);
    return sendServerError(res, "Failed to delete incident");
  }
}

async function clearIncidents(req, res) {
  try {
    const userEmail = normalizeEmail(req.user.email);

    const result = await Incident.deleteMany({ userEmail });

    return res.json({
      message: "Incident history cleared successfully",
      deletedCount: result.deletedCount || 0,
      userEmail,
    });
  } catch (error) {
    console.error("Clear incidents error:", error.message);
    return sendServerError(res, "Failed to clear incident history");
  }
}

module.exports = { analyzeIncident, getIncidents, getIncidentById, deleteIncident, clearIncidents };
