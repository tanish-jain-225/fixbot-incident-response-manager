const MAX_ANALYSIS_INPUT_LENGTH = 50000;
const MAX_FIELD_LENGTH = 8000;
const MIN_CODE_CONTEXT_LENGTH = 20;

function clampText(value) {
  return String(value || "").trim().slice(0, MAX_FIELD_LENGTH);
}

function getPrimaryLogSignal(logText) {
  const lines = String(logText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return "No explicit error signal found in submitted log.";
  }

  return lines[0].slice(0, 240);
}

function inferSeverityFromSignal(signal) {
  const value = String(signal || "").toLowerCase();

  if (value.includes("panic") || value.includes("fatal") || value.includes("crash") || value.includes("critical")) {
    return "critical";
  }

  if (value.includes("timeout") || value.includes("warning") || value.includes("deprecated") || value.includes("retry")) {
    return "warning";
  }

  return "minor";
}

function buildFallbackRootCause(signal) {
  return `Likely failure trigger: ${signal}. The provider response was incomplete, so the root cause is inferred from the submitted log context.`;
}

function buildFallbackFix(signal, codeSnippet) {
  const trimmedCode = clampText(codeSnippet);

  if (trimmedCode.length >= MIN_CODE_CONTEXT_LENGTH) {
    return [
      "// Context-aware stabilization patch",
      "// 1) Add defensive checks around values used near the failing path.",
      "// 2) Validate external inputs before processing.",
      "// 3) Add structured logging around this signal:",
      `//    ${signal}`,
      "",
      trimmedCode,
    ].join("\n");
  }

  return [
    "1. Guard against null/undefined values near the failing execution path.",
    "2. Validate input shape before business logic executes.",
    "3. Add targeted logs around the failing branch to verify assumptions.",
    `4. Reproduce with the reported signal: ${signal}`,
  ].join("\n");
}

function buildFallbackExplanation(signal) {
  return `The fix path focuses on preventing the observed failure (${signal}) by adding input guards, validation, and branch-level observability around the failing flow.`;
}

function normalizeSeverity(value) {
  const severity = String(value || "minor").trim().toLowerCase();
  if (severity === "critical") return "critical";
  if (severity === "warning") return "warning";
  return "minor";
}

function normalizeConfidenceScore(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return 35;
  }
  return Math.min(Math.max(parsed, 0), 100);
}

function normalizeAnalysisResponse(analysis, context = {}) {
  const signal = getPrimaryLogSignal(context.logText);
  const rootCause = clampText(analysis.rootCause) || buildFallbackRootCause(signal);
  const suggestedFix = clampText(analysis.suggestedFix) || buildFallbackFix(signal, context.codeSnippet);
  const explanation = clampText(analysis.explanation) || buildFallbackExplanation(signal);

  // Keep a stable lowercase contract for downstream server normalization.
  return {
    severity: normalizeSeverity(analysis.severity || inferSeverityFromSignal(signal)),
    rootCause,
    suggestedFix,
    explanation,
    confidenceScore: normalizeConfidenceScore(analysis.confidenceScore),
  };
}

function validateAnalyzePayload({ logText, codeSnippet }) {
  // Input limits protect provider cost and avoid oversized payload failures.
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
