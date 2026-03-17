const axios = require("axios");

const ML_SERVER_URL = process.env.ML_SERVER_URL || "http://localhost:8000";
const ML_TIMEOUT = 30000; // 30 seconds

function validateAnalysisShape(analysis) {
  if (!analysis.severity || !analysis.rootCause || !analysis.suggestedFix) {
    throw new Error("Invalid AI response structure from ML Server");
  }
}

function mapMlRequestError(error) {
  if (error.code === "ECONNREFUSED") {
    return new Error(`ML Server is not running at ${ML_SERVER_URL}`);
  }

  if (error.code === "ENOTFOUND") {
    return new Error(`Cannot reach ML Server at ${ML_SERVER_URL}`);
  }

  const status = error.response?.status;
  const mlError = error.response?.data?.error || error.message;

  if (status === 400) return new Error(`Invalid request to ML Server: ${mlError}`);
  if (status === 401) return new Error(`ML Service authentication failed: ${mlError}`);
  if (status === 429) return new Error(`ML Service rate limit exceeded: ${mlError}`);
  if (status === 503) return new Error(`ML Service unavailable (AI providers down): ${mlError}`);
  if (status === 504) return new Error(`ML Service request timed out: ${mlError}`);
  if (status === 502) return new Error(`ML Service received invalid AI response: ${mlError}`);
  if (status >= 500) return new Error(`ML Service error (${status}): ${mlError}`);

  return error;
}

async function analyzeWithML(logText, codeSnippet) {
  try {
    const response = await axios.post(
      `${ML_SERVER_URL}/api/analyze`,
      { logText, codeSnippet },
      {
        timeout: ML_TIMEOUT,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const analysis = response.data;
    validateAnalysisShape(analysis);

    return analysis;
  } catch (error) {
    throw mapMlRequestError(error);
  }
}

module.exports = { analyzeWithML };
