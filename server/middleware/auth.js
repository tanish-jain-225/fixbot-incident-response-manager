const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/http");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return sendError(res, 401, "Authorization token is required");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.userId,
      email: decoded.email,
    };
    return next();
  } catch (error) {
    return sendError(res, 401, "Invalid or expired token");
  }
}

module.exports = authMiddleware;
