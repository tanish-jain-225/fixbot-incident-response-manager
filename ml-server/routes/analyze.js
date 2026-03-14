const express = require("express");
const router = express.Router();
const { buildDebugPrompt } = require("../prompts/debugPrompt");
const { queryResinix } = require("../services/resinixService");

router.post("/", async (req, res) => {
  try {
    const { logText, codeSnippet } = req.body;

    // Validation
    if (!logText || typeof logText !== "string" || logText.trim() === "") {
      return res.status(400).json({ error: "logText is required and must be non-empty" });
    }

    if (logText.length > 50000) {
      return res.status(400).json({ error: "logText exceeds maximum length" });
    }

    if (codeSnippet && codeSnippet.length > 50000) {
      return res.status(400).json({ error: "codeSnippet exceeds maximum length" });
    }

    const prompt = buildDebugPrompt(logText, codeSnippet || "");
    const analysis = await queryResinix(prompt);

    // Normalize and validate response — lowercase to match Mongoose enum
    const normalizedSeverity = (analysis.severity || "minor").trim().toLowerCase();
    const confidenceScore = Math.min(Math.max(parseInt(analysis.confidenceScore) || 0, 0), 100);

    res.json({
      severity: normalizedSeverity,
      rootCause: analysis.rootCause || "Unable to determine root cause",
      suggestedFix: analysis.suggestedFix || "",
      explanation: analysis.explanation || "",
      confidenceScore: confidenceScore,
    });
  } catch (error) {
    console.error("Analysis error:", error.message);

    // Handle specific errors
    if (error.message.includes("RESINIX_API_KEY")) {
      return res.status(500).json({ error: "Resinix API key not configured" });
    }

    if (error.message.includes("API key")) {
      return res.status(401).json({ error: "Invalid Resinix API key" });
    }

    if (error.message.includes("rate limit")) {
      return res.status(429).json({ error: "Rate limit exceeded. Please try again later" });
    }

    if (error.message.includes("timeout")) {
      return res.status(504).json({ error: "Resinix API request timeout" });
    }

    if (error.message.includes("JSON")) {
      return res.status(502).json({ error: "Invalid response from Resinix API" });
    }

    res.status(500).json({ error: "Failed to analyze incident" });
  }
});

module.exports = router;
