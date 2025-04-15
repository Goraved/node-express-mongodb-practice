/**
 * Main application file for the e-shop Node.js backend
 * Sets up Express server with middleware, routes, and MongoDB connection
 */

// Import required packages
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");
const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/error-handler");

// Load environment variables from .env file
require("dotenv").config();

// Load models first to prevent recompilation issues
require('./models/User'); // Corrected case for import
require('./models/product');
require('./models/category');
require('./models/order');
require('./models/orderItem');

// Import route handlers
const productsRouter = require("./routers/products");
const categoriesRouter = require("./routers/categories");
const ordersRouter = require("./routers/orders");
const usersRouter = require("./routers/users");

// Initialize Express application
const app = express();

// Enable Cross-Origin Resource Sharing for all routes
app.use(cors());

// Middleware to parse JSON request body
app.use(express.json());

// Middleware to log HTTP requests in a compact format
app.use(morgan("tiny"));

// Middleware to serve static files from the "public/uploads" directory
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));

// Get API URL prefix
const api = process.env.API_URL;

// Register routes before JWT middleware to make them available to the Swagger generator
app.use(`${api}/products`, productsRouter);
app.use(`${api}/categories`, categoriesRouter);
app.use(`${api}/orders`, ordersRouter);
app.use(`${api}/users`, usersRouter);

// JWT authentication middleware (after routes are registered)
app.use(authJwt());

// Global error handler middleware
app.use(errorHandler);

// Import swagger AFTER routes are registered
const { swaggerServe, swaggerSetup } = require('./swagger');

// API Documentation
app.use('/api-docs', swaggerServe, swaggerSetup);

/**
 * Connect to MongoDB database
 * Uses connection string from environment variables
 * Specifies the database name explicitly
 */
mongoose
    .connect(process.env.CONNECTION_STRING, {
        dbName: "e-shop",
    })
    .then(() => {
        console.log("Database connection is ready");
    })
    .catch((err) => {
        console.log(err);
    });

/**
 * Start the Express server
 * Listens on port 3000 for incoming requests
 */
app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
