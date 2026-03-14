function mapMlServiceError(error) {
  const message = String(error && error.message ? error.message : "").toLowerCase();

  if (message.includes("resinix_api_key") || message.includes("gemini_api_key")) {
    return { statusCode: 500, message: "ML Service not configured properly" };
  }

  if (message.includes("rate limit exceeded")) {
    return { statusCode: 429, message: "AI rate limit exceeded. Please try again later." };
  }

  if (message.includes("authentication failed")) {
    return { statusCode: 500, message: "ML Service authentication error" };
  }

  if (message.includes("timed out")) {
    return { statusCode: 504, message: "ML Service request timed out" };
  }

  if (message.includes("invalid ai response")) {
    return { statusCode: 502, message: "ML Service returned an invalid response" };
  }

  if (message.includes("not running") || message.includes("cannot reach") || message.includes("connect")) {
    return { statusCode: 503, message: "ML Service is unavailable" };
  }

  return null;
}

module.exports = {
  mapMlServiceError,
};
