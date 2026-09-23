/**
 * In-memory "database" for the Lab Assignment.
 * Replace with a real DB (MongoDB/Postgres) in production.
 */

let products = [
  {
    id: "1",
    title: "Wireless Earbuds Pro",
    price: 4999,
    category: "electronics",
    description: "Noise-cancelling wireless earbuds with 30-hour battery life.",
    inventory: { stock: 120, warehouse: "KHI-01" },
    vendor: { id: "v101", name: "SoundTech Pvt Ltd" },
    rating: 4.5,
    createdAt: new Date().toISOString()
  },
  {
    id: "2",
    title: "Smart Fitness Watch",
    price: 8999,
    category: "electronics",
    description: "Tracks heart rate, sleep, and workouts. Water resistant.",
    inventory: { stock: 45, warehouse: "LHR-02" },
    vendor: { id: "v102", name: "FitGear Co" },
    rating: 4.2,
    createdAt: new Date().toISOString()
  },
  {
    id: "3",
    title: "Cotton Casual Shirt",
    price: 1499,
    category: "fashion",
    description: "100% cotton, breathable, available in multiple sizes.",
    inventory: { stock: 300, warehouse: "KHI-01" },
    vendor: { id: "v103", name: "UrbanWear" },
    rating: 4.0,
    createdAt: new Date().toISOString()
  }
];

let nextId = 4;

// In-memory idempotency store: idempotencyKey -> { statusCode, body }
const idempotencyStore = new Map();

// In-memory orders "database"
let orders = [];
let nextOrderId = 1;

module.exports = {
  products,
  getNextProductId: () => String(nextId++),
  idempotencyStore,
  orders,
  getNextOrderId: () => String(nextOrderId++)
};
