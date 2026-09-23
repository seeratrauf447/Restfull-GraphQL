const { idempotencyStore } = require("../data/store");
const ApiError = require("./ApiError");

/**
 * Solves Problem #2: "Duplicate Payment & Order Deductions".
 *
 * Client must send a unique `Idempotency-Key` header on every checkout
 * ATTEMPT (the same key is reused if the client retries after a network
 * failure/timeout). If we've already processed that key, we return the
 * ORIGINAL response instead of creating a second order.
 */
function idempotencyMiddleware(req, res, next) {
  const key = req.header("Idempotency-Key");

  if (!key) {
    return next(
      new ApiError(
        400,
        "MISSING_IDEMPOTENCY_KEY",
        "Idempotency-Key header is required for order creation to prevent duplicate orders."
      )
    );
  }

  if (idempotencyStore.has(key)) {
    const cached = idempotencyStore.get(key);
    // Return the exact same response as the first successful request
    return res.status(cached.statusCode).json(cached.body);
  }

  // Stash the key on req so the route handler can save the response after processing
  req.idempotencyKey = key;
  next();
}

module.exports = idempotencyMiddleware;
