# E-Commerce Platform API — Lab Assignment 03

A local Node.js/Express REST API for an e-commerce product catalog and order
system, built to fix three real-world backend problems:

1. **Unstandardized URIs & raw server crashes** → fixed with noun-based REST
   URIs and a central error-handling middleware that never leaks raw 500s.
2. **Duplicate payments/orders on network retry** → fixed with
   `Idempotency-Key`-based idempotent order creation.
3. **REST over-fetching** (50-field payload just to show a title & price) →
   fixed with a `?fields=` query parameter **and** a full `/graphql` endpoint.

---

## 🧰 Tech Stack

- Node.js + Express
- `graphql` + `graphql-http` (lightweight, actively maintained GraphQL server)
- `ruru` (GraphQL Playground UI)
- In-memory data store (no DB setup needed to run the lab)

---

## 🚀 Setup & Running

```bash
git clone <your-repo-url>
cd ecommerce-api
npm install
npm start
```

## 📸 Screenshots

### GraphQL Playground — Field Selection Test
![GraphQL query result]<img width="1280" height="680" alt="ss1" src="https://github.com/user-attachments/assets/e976d133-bb7f-4ebd-8e41-6212cb2afa3d" />


### REST API - Product List
![Products endpoint]



### Idempotent Order Creation Test
![Idempotency test]
<img width="1280" height="680" alt="ss4" src="https://github.com/user-attachments/assets/4ecb9a62-cbb7-4121-b6ff-0646051d333a" />


Server starts at: **http://localhost:3000**

You should see:
```
🚀 E-Commerce API running at http://localhost:3000
📦 REST:    http://localhost:3000/api/v1/products
🔗 GraphQL: http://localhost:3000/graphql (POST)
🧪 GraphQL Playground: http://localhost:3000/playground
```
<img width="1280" height="680" alt="ss3" src="https://github.com/user-attachments/assets/dda3681e-8f55-487c-a0ed-6988ad034f29" />























Optional (auto-restart on file changes):
```bash
npm run dev
```

---

## 📦 Module 1 — RESTful Architecture & Resource Modeling

Strictly noun-based URIs, correct HTTP verbs, idempotent `PUT`.

| Method | Endpoint                  | Description                          |
|--------|----------------------------|---------------------------------------|
| GET    | `/api/v1/products`         | List products (filter + paginate)    |
| GET    | `/api/v1/products/:id`     | Get one product (supports `?fields=`)|
| POST   | `/api/v1/products`         | Create a product → `201 Created`     |
| PUT    | `/api/v1/products/:id`     | Full replace (idempotent)            |
| DELETE | `/api/v1/products/:id`     | Delete a product → `204 No Content`  |

**Filtering & Pagination:**
```
GET /api/v1/products?category=electronics&minPrice=1000&maxPrice=9000&page=1&limit=5
```






**Idempotent PUT example** — calling this twice in a row produces the exact
same end state (no duplicated increments, no corrupted state):
```bash
curl -X PUT http://localhost:3000/api/v1/products/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Wireless Earbuds Pro Max","price":5499,"category":"electronics"}'
```

**Idempotent order creation** (fixes the "duplicate payment on retry" bug).
Send a client-generated UUID in the `Idempotency-Key` header. Retrying the
same request with the same key returns the *original* order instead of
creating a new one:

```bash
KEY=$(uuidgen)

curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $KEY" \
  -d '{"productId":"1","quantity":2}'

# Simulate a network-retry with the SAME key -> same order returned, no duplicate
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $KEY" \
  -d '{"productId":"1","quantity":2}'
```

---

## ⚠️ Module 2 — Consistent Error Schema & Status Codes

Every error response — anywhere in the API — has the same JSON shape:

```json
{
  "error_code": "PRODUCT_NOT_FOUND",
  "message": "Product with ID 123 does not exist",
  "timestamp": "2026-09-22T10:15:00.000Z"
}
```

| Scenario                              | Status | error_code             |
|----------------------------------------|--------|-------------------------|
| Missing/invalid fields on create/update | 400    | `VALIDATION_ERROR`       |
| Missing `Idempotency-Key` on order      | 400    | `MISSING_IDEMPOTENCY_KEY`|
| Product ID doesn't exist                | 404    | `PRODUCT_NOT_FOUND`      |
| Order ID doesn't exist                  | 404    | `ORDER_NOT_FOUND`        |
| Unknown route                           | 404    | `ROUTE_NOT_FOUND`        |
| Successful creation                     | 201    | —                        |
| Successful delete                       | 204    | —                        |
| Unexpected server bug                   | 500    | `INTERNAL_SERVER_ERROR`  |

Client mistakes **never** crash the server or return a raw stack trace —
they're all caught by the central `errorHandler` middleware
(`middleware/errorHandler.js`) and converted to the schema above.

---

## 🔎 Module 3 — Solving Over-Fetching

### Option A: Field-filtering query parameter
```bash
# Full 50-field-style object (over-fetching)
curl http://localhost:3000/api/v1/products/1

# Only what the banner UI needs
curl "http://localhost:3000/api/v1/products/1?fields=title,price"
```

### Option B: GraphQL endpoint
- Query endpoint: `POST /graphql`
- Interactive playground: open **http://localhost:3000/playground** in a browser

Example query (client dictates exactly which fields it wants):
```graphql
{
  product(id: "1") {
    title
    price
  }
}
```

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ product(id: \"1\") { title price } }"}'
```

Query a filtered list:
```graphql
{
  products(category: "electronics") {
    id
    title
    price
    rating
  }
}
```

---

## 📁 Project Structure

```
ecommerce-api/
├── server.js                  # App entry point, mounts routes + middleware
├── data/
│   └── store.js                # In-memory "database"
├── routes/
│   ├── products.js             # Product CRUD, filtering, pagination, fields
│   └── orders.js                # Idempotent order creation
├── middleware/
│   ├── ApiError.js              # Custom error class
│   ├── errorHandler.js          # Central error handler + standardized schema
│   ├── idempotency.js           # Idempotency-Key handling for orders
│   └── validateProduct.js       # 400 validation for product payloads
├── graphql/
│   └── schema.js                # GraphQL types + resolvers
├── package.json
└── README.md
```

---

## ✅ Quick Test Checklist

```bash
# 1. List + filter + paginate
curl "http://localhost:3000/api/v1/products?category=electronics&limit=1"

# 2. 404 with standardized schema
curl http://localhost:3000/api/v1/products/999

# 3. 400 validation error
curl -X POST http://localhost:3000/api/v1/products -H "Content-Type: application/json" -d '{}'

# 4. 201 Created
curl -X POST http://localhost:3000/api/v1/products -H "Content-Type: application/json" \
  -d '{"title":"Test Item","price":100,"category":"misc"}'

# 5. Idempotent PUT
curl -X PUT http://localhost:3000/api/v1/products/1 -H "Content-Type: application/json" \
  -d '{"title":"Updated","price":200,"category":"misc"}'

# 6. 204 Delete
curl -X DELETE http://localhost:3000/api/v1/products/1

# 7. Field selection (over-fetch fix)
curl "http://localhost:3000/api/v1/products/2?fields=title,price"

# 8. GraphQL
curl -X POST http://localhost:3000/graphql -H "Content-Type: application/json" \
  -d '{"query":"{ product(id: \"2\") { title price } }"}'
```

---

## 👤 Author

Lab Assignment 03 — API Architecture & Design (RESTful + GraphQL)
