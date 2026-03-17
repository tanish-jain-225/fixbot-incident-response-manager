const axios = require("axios");
const aiModel = require("../config/aiModel");

function isTimeoutError(error) {
  return error && (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT");
}

function stringifyErrorDetails(value) {
  if (!value) {
    return "Unknown error";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    if (typeof value.message === "string" && value.message.trim()) {
      return value.message;
    }

    if (value.error && typeof value.error === "object" && typeof value.error.message === "string") {
      return value.error.message;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function formatProviderError(providerName, error) {
  const status = error?.response?.status;
  const details = stringifyErrorDetails(error?.response?.data?.error || error?.response?.data || error?.message);

  if (status) {
    return `${providerName} (${status}): ${details}`;
  }

  return `${providerName}: ${details}`;
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
    "";

  const suggestedFix =
    data.suggestedFix ||
    data.suggested_fix ||
    data.fix ||
    "";

  const explanation =
    data.explanation ||
    data.reasoning ||
    "";

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
    return { result, primaryError: null };
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

    return { result: null, primaryError };
  }
}

async function callFallbackProvider(prompt, primaryError) {
  try {
    const result = await callModel(aiModel.fallback, prompt);
    return result;
  } catch (fallbackError) {
    mapProviderAuthOrLimitError(fallbackError, "Gemini");
    if (isTimeoutError(fallbackError)) {
      throw new Error("Gemini API request timeout");
    }

    const primaryDetails = formatProviderError("Resinix", primaryError);
    const fallbackDetails = formatProviderError("Gemini", fallbackError);
    throw new Error(`Both AI providers failed. ${primaryDetails}. ${fallbackDetails}`);
  }
}

// Main entry point: Resinix -> Gemini fallback
async function queryResinix(prompt) {
  const { result: primaryResult, primaryError } = await callPrimaryProvider(prompt);
  if (primaryResult) {
    return primaryResult;
  }

  return callFallbackProvider(prompt, primaryError);
}

module.exports = { queryResinix };
