const axios = require("axios");
const aiModel = require("../config/aiModel");

function isTimeoutError(error) {
  return error && (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT");
}

function getResponseText(model, responseData) {
  const content = model.parseResponse(responseData);
  if (!content) {
    throw new Error(`Empty response from ${model.provider}`);
  }

  return content;
}

function parseProviderJson(model, content) {
  const jsonCandidate = extractJsonCandidate(content);

  try {
    if (jsonCandidate && typeof jsonCandidate === "object") {
      return jsonCandidate;
    }

    return JSON.parse(jsonCandidate);
  } catch {
    console.warn(`[${model.provider}] JSON parse failed, using fallback-normalized response.`);
    return {};
  }
}

function mapProviderAuthOrLimitError(error, providerName) {
  if (error.response?.status === 401) {
    throw new Error(`Invalid ${providerName} API key`);
  }

  if (error.response?.status === 429) {
    throw new Error(`${providerName} API rate limit exceeded`);
  }
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

  // Each provider has its own response shape, but both return plain text content.
  const content = getResponseText(model, response.data);
  const parsed = parseProviderJson(model, content);

  return normalizeParsedResponse(parsed, content);
}

async function callPrimaryProvider(prompt) {
  try {
    const result = await callModel(aiModel.primary, prompt);
    console.log(`[ai] Response from primary (${aiModel.primary.provider})`);
    return result;
  } catch (primaryError) {
    // Surface hard provider failures immediately.
    mapProviderAuthOrLimitError(primaryError, "Resinix");
    if (isTimeoutError(primaryError)) {
      throw new Error("Resinix API request timeout");
    }

    // Fallback is only allowed for connectivity/server-side failures.
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
    mapProviderAuthOrLimitError(fallbackError, "Gemini");
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
