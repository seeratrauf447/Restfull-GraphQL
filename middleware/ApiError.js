/**
 * Custom error class carrying an HTTP status + machine-readable error_code.
 * Thrown anywhere in routes; caught by the central errorHandler middleware.
 */
class ApiError extends Error {
  constructor(statusCode, errorCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

module.exports = ApiError;
