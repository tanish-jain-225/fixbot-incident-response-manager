const MAX_ANALYSIS_INPUT_LENGTH = 50000;

function normalizeSeverity(value) {
  const severity = String(value || "minor").trim().toLowerCase();
  if (severity === "critical") return "critical";
  if (severity === "warning") return "warning";
  return "minor";
}

function normalizeConfidenceScore(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return Math.min(Math.max(parsed, 0), 100);
}

function normalizeAnalysisResponse(analysis) {
  return {
    severity: normalizeSeverity(analysis.severity),
    rootCause: analysis.rootCause || "Unable to determine root cause",
    suggestedFix: analysis.suggestedFix || "",
    explanation: analysis.explanation || "",
    confidenceScore: normalizeConfidenceScore(analysis.confidenceScore),
  };
}

function validateAnalyzePayload({ logText, codeSnippet }) {
  if (!logText || typeof logText !== "string" || logText.trim() === "") {
    return "logText is required and must be non-empty";
  }

  if (logText.length > MAX_ANALYSIS_INPUT_LENGTH) {
    return "logText exceeds maximum length";
  }

  if (codeSnippet && codeSnippet.length > MAX_ANALYSIS_INPUT_LENGTH) {
    return "codeSnippet exceeds maximum length";
  }

  return null;
}

module.exports = {
  normalizeAnalysisResponse,
  validateAnalyzePayload,
};
