const express = require("express");
const router = express.Router();
const { products, orders, getNextOrderId, idempotencyStore } = require("../data/store");
const ApiError = require("../middleware/ApiError");
const idempotencyMiddleware = require("../middleware/idempotency");

/**
 * POST /api/v1/orders
 * Demonstrates the fix for Problem #2 (duplicate orders on retry).
 * Client MUST send header: Idempotency-Key: <uuid>
 *
 * Retry the exact same request with the SAME key -> same order returned,
 * no duplicate created, no double payment deduction.
 */
router.post("/", idempotencyMiddleware, (req, res, next) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity || quantity <= 0) {
    return next(
      new ApiError(400, "VALIDATION_ERROR", "productId and a positive quantity are required")
    );
  }

  const product = products.find((p) => p.id === String(productId));
  if (!product) {
    return next(
      new ApiError(404, "PRODUCT_NOT_FOUND", `Product with ID ${productId} does not exist`)
    );
  }

  const newOrder = {
    id: getNextOrderId(),
    productId: product.id,
    productTitle: product.title,
    quantity,
    totalAmount: product.price * quantity,
    status: "CONFIRMED",
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);

  const responseBody = { data: newOrder };

  // Cache this response against the idempotency key for 24h (demo: kept in memory indefinitely)
  idempotencyStore.set(req.idempotencyKey, { statusCode: 201, body: responseBody });

  res.status(201).location(`/api/v1/orders/${newOrder.id}`).json(responseBody);
});

/**
 * GET /api/v1/orders/:id
 */
router.get("/:id", (req, res, next) => {
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) {
    return next(
      new ApiError(404, "ORDER_NOT_FOUND", `Order with ID ${req.params.id} does not exist`)
    );
  }
  res.status(200).json(order);
});

module.exports = router;
