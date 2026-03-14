function sendError(res, statusCode, message) {
  return res.status(statusCode).json({ error: message });
}

function sendServerError(res, message = "Internal server error") {
  return sendError(res, 500, message);
}

module.exports = {
  sendError,
  sendServerError,
};
