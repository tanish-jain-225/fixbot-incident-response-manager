const express = require("express");
const router = express.Router();
const { buildDebugPrompt } = require("../prompts/debugPrompt");
const { queryResinix } = require("../services/resinixService");
const { sendError, sendServerError } = require("../utils/http");
const { validateAnalyzePayload, normalizeAnalysisResponse } = require("../utils/analysis");
const { mapAnalyzeError } = require("../utils/aiErrors");

router.post("/", async (req, res) => {
  try {
    const { logText, codeSnippet } = req.body;

    const validationError = validateAnalyzePayload({ logText, codeSnippet });
    if (validationError) {
      return sendError(res, 400, validationError);
    }

    const prompt = buildDebugPrompt(logText, codeSnippet || "");
    const analysis = await queryResinix(prompt);

    return res.json(normalizeAnalysisResponse(analysis));
  } catch (error) {
    console.error("Analysis error:", error.message);

    const mappedError = mapAnalyzeError(error);
    if (mappedError) {
      return sendError(res, mappedError.statusCode, mappedError.message);
    }

    return sendServerError(res, "Failed to analyze incident");
  }
});

module.exports = router;
