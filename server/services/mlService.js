const axios = require("axios");

const ML_SERVER_URL = process.env.ML_SERVER_URL;
const ML_TIMEOUT = 30000; // 30 seconds

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

    // Validate response structure
    const analysis = response.data;
    if (!analysis.severity || !analysis.rootCause || !analysis.suggestedFix) {
      throw new Error("Invalid response structure from ML Server");
    }

    return analysis;
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      throw new Error(`ML Server is not running at ${ML_SERVER_URL}`);
    }
    if (error.code === "ENOTFOUND") {
      throw new Error(`Cannot reach ML Server at ${ML_SERVER_URL}`);
    }
    const status = error.response?.status;
    const mlError = error.response?.data?.error || error.message;
    if (status === 400) throw new Error(`Invalid request to ML Server: ${mlError}`);
    if (status === 401) throw new Error(`ML Service authentication failed: ${mlError}`);
    if (status === 429) throw new Error(`ML Service rate limit exceeded: ${mlError}`);
    if (status === 504) throw new Error(`ML Service request timed out: ${mlError}`);
    if (status === 502) throw new Error(`ML Service received invalid AI response: ${mlError}`);
    if (status >= 500) throw new Error(`ML Service error (${status}): ${mlError}`);
    throw error;
  }
}

module.exports = { analyzeWithML };
