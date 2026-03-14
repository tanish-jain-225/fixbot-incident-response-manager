function buildDebugPrompt(logText, codeSnippet) {
  return `You are an expert software debugging assistant called FixBot.

Analyze the following error log and code snippet. Provide a structured JSON response.

Error Log:
${logText}

Code Snippet:
${codeSnippet}

Respond ONLY with valid JSON in the following format:
{
  "severity": "Critical" | "Warning" | "Minor",
  "rootCause": "A clear explanation of why this error occurs",
  "suggestedFix": "The corrected code snippet",
  "explanation": "A brief explanation of what was changed and why",
  "confidenceScore": <number between 0 and 100>
}`;
}

module.exports = { buildDebugPrompt };
