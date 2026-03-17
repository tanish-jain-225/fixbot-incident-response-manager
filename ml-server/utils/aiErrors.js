function mapAnalyzeError(error) {
  const message = String(error && error.message ? error.message : "").toLowerCase();

  // Map provider/service errors to stable HTTP responses for the API caller.
  if (message.includes("resinix_api_key")) {
    return { statusCode: 500, message: "Resinix API key not configured" };
  }

  if (message.includes("gemini_api_key")) {
    return { statusCode: 500, message: "Gemini API key not configured" };
  }

  if (message.includes("invalid resinix api key") || message.includes("invalid gemini api key")) {
    return { statusCode: 401, message: "Invalid API key for AI provider" };
  }

  if (message.includes("rate limit")) {
    return { statusCode: 429, message: "Rate limit exceeded. Please try again later" };
  }

  if (message.includes("timeout") || message.includes("timed out")) {
    return { statusCode: 504, message: "AI provider request timeout" };
  }

  if (message.includes("both ai providers failed") || message.includes("503")) {
    return { statusCode: 503, message: error.message || "AI providers are temporarily unavailable" };
  }

  if (message.includes("json") || message.includes("invalid ai response")) {
    return { statusCode: 502, message: "Invalid response from AI provider" };
  }

  return null;
}

module.exports = {
  mapAnalyzeError,
};
