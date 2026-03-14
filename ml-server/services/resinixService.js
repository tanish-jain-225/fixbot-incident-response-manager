const axios = require("axios");
const aiModel = require("../config/aiModel");

function isTimeoutError(error) {
  return error && (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT");
}

function extractJsonCandidate(content) {
  if (typeof content !== "string") {
    return null;
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return null;
  }

  // Handle markdown fenced JSON blocks.
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function coerceConfidenceScore(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(Math.max(Math.round(value), 0), 100);
  }

  if (typeof value === "string") {
    const cleaned = value.replace("%", "").trim();
    const parsed = Number.parseFloat(cleaned);
    if (Number.isFinite(parsed)) {
      return Math.min(Math.max(Math.round(parsed), 0), 100);
    }
  }

  return 70;
}

function normalizeParsedResponse(parsed, rawContent) {
  const data = parsed && typeof parsed === "object" ? parsed : {};

  const rootCause =
    data.rootCause ||
    data.root_cause ||
    data.cause ||
    "Unable to determine root cause from AI response";

  const suggestedFix =
    data.suggestedFix ||
    data.suggested_fix ||
    data.fix ||
    "No direct code fix was provided by the AI.";

  const explanation =
    data.explanation ||
    data.reasoning ||
    "Analysis completed with a fallback-normalized response.";

  const rawSeverity = String(data.severity || data.priority || "minor").toLowerCase();
  const severity = rawSeverity.includes("crit")
    ? "critical"
    : rawSeverity.includes("warn")
      ? "warning"
      : "minor";

  const confidenceScore = coerceConfidenceScore(data.confidenceScore ?? data.confidence ?? data.score);

  // Keep a compact clue for debugging when the provider payload is unusual.
  const providerRaw = typeof rawContent === "string" ? rawContent.slice(0, 250) : "";

  return {
    severity,
    rootCause,
    suggestedFix,
    explanation,
    confidenceScore,
    providerRaw,
  };
}

// ── Shared: call any model object and parse the response ─
async function callModel(model, prompt) {
  const response = await axios.post(
    model.apiUrl,
    model.buildRequestBody(prompt),
    { headers: model.getHeaders(), timeout: model.timeout }
  );

  // Each model knows how to extract text from its own response shape
  const content = model.parseResponse(response.data);
  if (!content) throw new Error(`Empty response from ${model.provider}`);

  let parsed;
  const jsonCandidate = extractJsonCandidate(content);
  try {
    if (jsonCandidate && typeof jsonCandidate === "object") {
      parsed = jsonCandidate;
    } else {
      parsed = JSON.parse(jsonCandidate);
    }
  } catch {
    console.warn(`[${model.provider}] JSON parse failed, using fallback-normalized response.`);
    parsed = {};
  }

  return normalizeParsedResponse(parsed, content);
}

async function callPrimaryProvider(prompt) {
  try {
    const result = await callModel(aiModel.primary, prompt);
    console.log(`[ai] Response from primary (${aiModel.primary.provider})`);
    return result;
  } catch (primaryError) {
    // Surface hard failures immediately (wrong key, rate-limit)
    if (primaryError.response?.status === 401) {
      throw new Error("Invalid Resinix API key");
    }
    if (primaryError.response?.status === 429) {
      throw new Error("Resinix API rate limit exceeded");
    }
    if (isTimeoutError(primaryError)) {
      throw new Error("Resinix API request timeout");
    }

    // Only attempt fallback for network/server errors
    if (!aiModel.shouldFallback(primaryError)) {
      throw primaryError;
    }

    console.warn(
      `[ai] Primary (${aiModel.primary.provider}) failed: ${primaryError.message}. ` +
      `Falling back to ${aiModel.fallback.provider}...`
    );

    return null;
  }
}

async function callFallbackProvider(prompt) {
  try {
    const result = await callModel(aiModel.fallback, prompt);
    console.log(`[ai] Response from fallback (${aiModel.fallback.provider})`);
    return result;
  } catch (fallbackError) {
    if (fallbackError.response?.status === 401) {
      throw new Error("Invalid Gemini API key");
    }
    if (fallbackError.response?.status === 429) {
      throw new Error("Gemini API rate limit exceeded");
    }
    if (isTimeoutError(fallbackError)) {
      throw new Error("Gemini API request timeout");
    }
    throw new Error(`Both AI providers failed. Last error: ${fallbackError.message}`);
  }
}

// Main entry point: Resinix -> Gemini fallback
async function queryResinix(prompt) {
  const primaryResult = await callPrimaryProvider(prompt);
  if (primaryResult) {
    return primaryResult;
  }

  return callFallbackProvider(prompt);
}

module.exports = { queryResinix };
