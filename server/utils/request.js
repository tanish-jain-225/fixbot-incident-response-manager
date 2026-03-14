const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidObjectId(value) {
  return OBJECT_ID_REGEX.test(String(value || ""));
}

function parseNonNegativeInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

function parsePagination(query, options = {}) {
  const defaultLimit = options.defaultLimit || 50;
  const maxLimit = options.maxLimit || 100;

  const skip = parseNonNegativeInt(query.skip, 0);
  const requestedLimit = parseNonNegativeInt(query.limit, defaultLimit);
  const limit = Math.min(requestedLimit, maxLimit);

  return { limit, skip };
}

module.exports = {
  normalizeEmail,
  isValidObjectId,
  parsePagination,
};
