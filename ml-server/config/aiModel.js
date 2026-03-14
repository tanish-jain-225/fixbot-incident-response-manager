require("dotenv").config();

// ─────────────────────────────────────────────────────────
//  Centralised AI model configuration
//  Primary  : Resinix AI
//  Fallback : Google AI Studio (Gemini) — native API
//  Every part of the ML server imports from here.
// ─────────────────────────────────────────────────────────

// Shared system prompt used by both providers
const SYSTEM_PROMPT =
  "You are a senior software engineer specializing in debugging and incident resolution. " +
  "Always respond with valid JSON matching the exact schema provided.";

// ── Primary: Resinix ────────────────────────────────────
const primary = {
  provider: "resinix",
  name: "resinix-default",
  apiUrl: process.env.RESINIX_API_URL,
  get apiKey() { return process.env.RESINIX_API_KEY },
  temperature: 0.3,
  maxTokens: 1024,
  timeout: 30000,
  systemPrompt: SYSTEM_PROMPT,

  getHeaders() {
    const key = this.apiKey;
    if (!key) throw new Error("RESINIX_API_KEY is not set in environment variables");
    return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  },

  buildRequestBody(userPrompt) {
    return {
      model: this.name,
      messages: [
        { role: "system", content: this.systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      temperature: this.temperature,
      max_tokens:  this.maxTokens,
    };
  },

  // Extract text content from the OpenAI-style response
  parseResponse(data) {
    return data.choices?.[0]?.message?.content || null;
  },
};

// ── Fallback: Google AI Studio (native Gemini API) ───────
//
//  Auth  : x-goog-api-key header  (NOT Authorization: Bearer)
//  URL   : .../models/{model}:generateContent
//  Body  : { systemInstruction, contents, generationConfig }
//  Key   : https://aistudio.google.com/apikey
//
const fallback = {
  provider: "google-ai-studio",
  name: process.env.GEMINI_MODEL,
  get apiUrl() {
    return `https://generativelanguage.googleapis.com/v1beta/models/${this.name}:generateContent`;
  },
  get apiKey() { return process.env.GEMINI_API_KEY },
  temperature: 0.3,
  maxTokens: 1024,
  timeout: 30000,
  systemPrompt: SYSTEM_PROMPT,

  getHeaders() {
    const key = this.apiKey;
    if (!key) throw new Error("GEMINI_API_KEY is not set in environment variables");
    return {
      "x-goog-api-key": key,
      "Content-Type": "application/json",
    };
  },

  buildRequestBody(userPrompt) {
    return {
      systemInstruction: {
        parts: [{ text: this.systemPrompt }],
      },
      contents: [
        { role: "user", parts: [{ text: userPrompt }] },
      ],
      generationConfig: {
        temperature: this.temperature,
        maxOutputTokens: this.maxTokens,
        responseMimeType: "application/json", // Gemini returns clean JSON directly
      },
    };
  },

  // Extract text content from the Gemini-native response
  parseResponse(data) {
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  },
};

// Errors from the primary that should trigger a fallback attempt
const FALLBACK_TRIGGER_CODES = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "ECONNABORTED",
  "ETIMEDOUT",
  "ERR_NETWORK",
]);

function shouldFallback(error) {
  if (FALLBACK_TRIGGER_CODES.has(error.code)) return true;
  const status = error.response?.status;
  // Trigger fallback on server-side errors but NOT on 401/429 (key/rate issues)
  return status != null && status >= 500;
}

const aiModel = {
  primary,
  fallback,
  shouldFallback,
};

module.exports = aiModel;
