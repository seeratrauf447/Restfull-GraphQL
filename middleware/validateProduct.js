const ApiError = require("./ApiError");

/**
 * Solves part of Problem #1: raw 500s on bad client input.
 * Any validation failure here -> clean 400 Bad Request, never a crash.
 */
function validateProductPayload(req, res, next) {
  const { title, price, category } = req.body;
  const errors = [];

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    errors.push("title is required and must be a non-empty string");
  }

  if (price === undefined || typeof price !== "number" || price <= 0) {
    errors.push("price is required and must be a positive number");
  }

  if (!category || typeof category !== "string") {
    errors.push("category is required and must be a string");
  }

  if (errors.length > 0) {
    return next(
      new ApiError(400, "VALIDATION_ERROR", `Invalid product data: ${errors.join("; ")}`)
    );
  }

  next();
}

module.exports = validateProductPayload;
