const express = require("express");
const { createHandler } = require("graphql-http/lib/use/express");
const { ruruHTML } = require("ruru/server");
const schema = require("./graphql/schema");
const productsRouter = require("./routes/products");
const ordersRouter = require("./routes/orders");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ---- Health check ----
app.get("/", (req, res) => {
  res.status(200).json({
    message: "E-Commerce API is running",
    docs: {
      products: "/api/v1/products",
      orders: "/api/v1/orders",
      graphql: "/graphql (POST queries)",
      graphql_playground: "/playground (open in browser)"
    }
  });
});

// ---- REST Module: Products & Orders ----
app.use("/api/v1/products", productsRouter);
app.use("/api/v1/orders", ordersRouter);

// ---- GraphQL Module: Over-fetching solution ----
// POST /graphql -> actual GraphQL query execution (used by apps/clients)
app.all("/graphql", createHandler({ schema }));

// GET /playground -> visual GraphQL playground (open this in a browser to test queries)
app.get("/playground", (req, res) => {
  res.type("html").send(ruruHTML({ endpoint: "/graphql" }));
});

// ---- 404 for unknown routes ----
app.use(notFoundHandler);

// ---- Central error handler (must be LAST) ----
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 E-Commerce API running at http://localhost:${PORT}`);
  console.log(`📦 REST:    http://localhost:${PORT}/api/v1/products`);
  console.log(`🔗 GraphQL: http://localhost:${PORT}/graphql (POST)`);
  console.log(`🧪 GraphQL Playground: http://localhost:${PORT}/playground`);
});

module.exports = app;
