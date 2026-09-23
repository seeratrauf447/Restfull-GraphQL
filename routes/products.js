const express = require("express");
const router = express.Router();
const { products, getNextProductId } = require("../data/store");
const ApiError = require("../middleware/ApiError");
const validateProductPayload = require("../middleware/validateProduct");

/**
 * Utility: project only the requested fields from an object.
 * Solves Problem #3 (REST over-fetching) via ?fields=title,price
 */
function projectFields(obj, fieldsParam) {
  if (!fieldsParam) return obj;
  const fields = fieldsParam.split(",").map((f) => f.trim()).filter(Boolean);
  const result = {};
  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(obj, field)) {
      result[field] = obj[field];
    }
  });
  return result;
}

/**
 * GET /api/v1/products
 * Supports:
 *  - Filtering:  ?category=electronics&minPrice=1000&maxPrice=9000
 *  - Pagination: ?page=1&limit=5
 *  - Field selection (over-fetching fix): ?fields=title,price
 */
router.get("/", (req, res) => {
  let result = [...products];

  // ---- Filtering ----
  const { category, minPrice, maxPrice, fields, page = 1, limit = 10 } = req.query;

  if (category) {
    result = result.filter(
      (p) => p.category.toLowerCase() === String(category).toLowerCase()
    );
  }
  if (minPrice) {
    result = result.filter((p) => p.price >= Number(minPrice));
  }
  if (maxPrice) {
    result = result.filter((p) => p.price <= Number(maxPrice));
  }

  // ---- Pagination ----
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const total = result.length;
  const totalPages = Math.ceil(total / limitNum) || 1;
  const start = (pageNum - 1) * limitNum;
  const paginated = result.slice(start, start + limitNum);

  // ---- Field selection (over-fetching fix) ----
  const data = paginated.map((p) => projectFields(p, fields));

  res.status(200).json({
    data,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      total_pages: totalPages
    }
  });
});

/**
 * GET /api/v1/products/:id
 * Supports ?fields=title,price to avoid over-fetching the full 50-field object.
 */
router.get("/:id", (req, res, next) => {
  const product = products.find((p) => p.id === req.params.id);

  if (!product) {
    return next(
      new ApiError(404, "PRODUCT_NOT_FOUND", `Product with ID ${req.params.id} does not exist`)
    );
  }

  const { fields } = req.query;
  res.status(200).json(projectFields(product, fields));
});

/**
 * POST /api/v1/products
 * Creates a new product. Returns 201 Created + Location header.
 */
router.post("/", validateProductPayload, (req, res) => {
  const { title, price, category, description, inventory, vendor, rating } = req.body;

  const newProduct = {
    id: getNextProductId(),
    title,
    price,
    category,
    description: description || "",
    inventory: inventory || { stock: 0, warehouse: "UNASSIGNED" },
    vendor: vendor || { id: null, name: "Unknown" },
    rating: rating || 0,
    createdAt: new Date().toISOString()
  };

  products.push(newProduct);

  res
    .status(201)
    .location(`/api/v1/products/${newProduct.id}`)
    .json(newProduct);
});

/**
 * PUT /api/v1/products/:id
 * FULL REPLACE of the resource -> naturally IDEMPOTENT.
 * Calling this N times with the same body always results in the same state.
 */
router.put("/:id", validateProductPayload, (req, res, next) => {
  const index = products.findIndex((p) => p.id === req.params.id);

  if (index === -1) {
    return next(
      new ApiError(404, "PRODUCT_NOT_FOUND", `Product with ID ${req.params.id} does not exist`)
    );
  }

  const { title, price, category, description, inventory, vendor, rating } = req.body;

  // Full replace (idempotent) - keep id/createdAt, overwrite everything else
  products[index] = {
    ...products[index],
    title,
    price,
    category,
    description: description || "",
    inventory: inventory || products[index].inventory,
    vendor: vendor || products[index].vendor,
    rating: rating !== undefined ? rating : products[index].rating,
    updatedAt: new Date().toISOString()
  };

  res.status(200).json(products[index]);
});

/**
 * DELETE /api/v1/products/:id
 * Also idempotent in effect: deleting an already-deleted resource
 * returns 404 consistently rather than crashing.
 */
router.delete("/:id", (req, res, next) => {
  const index = products.findIndex((p) => p.id === req.params.id);

  if (index === -1) {
    return next(
      new ApiError(404, "PRODUCT_NOT_FOUND", `Product with ID ${req.params.id} does not exist`)
    );
  }

  products.splice(index, 1);
  res.status(204).send(); // No Content
});

module.exports = router;
