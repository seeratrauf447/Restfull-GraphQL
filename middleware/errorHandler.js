const ApiError = require("./ApiError");

/**
 * Standardized error schema for ALL error responses:
 * {
 *   "error_code": "PRODUCT_NOT_FOUND",
 *   "message": "Product with ID 123 does not exist",
 *   "timestamp": "2026-09-22T10:15:00.000Z"
 * }
 *
 * This ensures the mobile app NEVER receives a raw stack trace / generic 500
 * for client-caused errors (Problem #1 from the case study).
 */
function errorHandler(err, req, res, next) {
  // Known, expected errors (validation, not found, etc.)
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error_code: err.errorCode,
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }

  // Unexpected/unknown errors -> genuine server fault -> 500
  console.error("UNEXPECTED ERROR:", err);
  return res.status(500).json({
    error_code: "INTERNAL_SERVER_ERROR",
    message: "Something went wrong on our end. Please try again later.",
    timestamp: new Date().toISOString()
  });
}

// 404 handler for routes that don't exist at all (e.g. /api/v1/foobar)
function notFoundHandler(req, res) {
  res.status(404).json({
    error_code: "ROUTE_NOT_FOUND",
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
}

module.exports = { errorHandler, notFoundHandler };
