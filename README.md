# E-Shop API - Node.js Practice Project

A robust RESTful API built with Node.js, Express, and MongoDB for an e-commerce application. This project serves as a practice implementation demonstrating proper REST architecture, database modeling, authentication, documentation, and security practices.

## Overview

This project is a practice implementation of a backend e-commerce system with the following features:

- User authentication and authorization with JWT
- Product catalog management with image uploads
- Category management
- Order processing system
- Automatic API documentation with Swagger
- Security best practices implementation

## Project Structure

```
node-express-mongodb-practice/
├── models/                 # Mongoose data models
│   ├── category.js         # Category model
│   ├── order.js            # Order model
│   ├── orderItem.js        # Order item model
│   ├── product.js          # Product model
│   └── User.js             # User model
├── routers/                # Express route handlers
│   ├── categories.js       # Category endpoints
│   ├── orders.js           # Order endpoints
│   ├── products.js         # Product endpoints
│   └── users.js            # User endpoints
├── helpers/                # Helper functions
│   ├── error-handler.js    # Global error handler
│   └── jwt.js              # JWT authentication
├── utils/                  # Utility functions
│   ├── swagger-route-generator.js    # Auto-generate Swagger routes
│   └── swagger-schema-generator.js   # Auto-generate Swagger schemas
├── public/                 # Static files
│   └── uploads/            # Product image uploads
├── app.js                  # Main application file
├── swagger.js              # Swagger configuration
├── package.json            # Project dependencies
├── .env                    # Environment variables
└── README.md               # Project documentation
```

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd node-express-mongodb-practice
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file in the project root with the following content:
   ```
   API_URL=/api/v1
   CONNECTION_STRING=mongodb://localhost:27017/e-shop
   JWT_SECRET=your-secret-key-here
   ```

4. Create a directory for product uploads:
   ```bash
   mkdir -p public/uploads
   ```

5. Start the server:
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Development mode with Swagger documentation reminder
   npm run docs
   
   # Production mode
   npm start
   ```

## Environment Variables

The following environment variables are required:

| Variable | Description | Example |
|----------|-------------|---------|
| `API_URL` | Base URL prefix for all API endpoints | `/api/v1` |
| `CONNECTION_STRING` | MongoDB connection URL | `mongodb://localhost:27017/e-shop` |
| `JWT_SECRET` | Secret key for JWT token generation and verification | `your-secret-key` |

## Authentication

The API uses JSON Web Tokens (JWT) for authentication:

1. **Register a user**:
   ```
   POST /api/v1/users
   ```

2. **Login to receive a token**:
   ```
   POST /api/v1/users/login
   ```
   This returns a JWT token that should be included in subsequent requests.

3. **Using the token**: Add the token to the Authorization header as a Bearer token:
   ```
   Authorization: Bearer <your-token>
   ```

The following routes are accessible without authentication:
- GET requests to product endpoints
- GET requests to category endpoints
- User login and registration endpoints
- Swagger documentation

All other routes require admin privileges.

## API Documentation with Swagger

This project features automatic API documentation with Swagger UI. The documentation is generated from:

1. Mongoose model definitions
2. Express route configurations
3. JSDoc annotations in the code

### Accessing the Documentation

After starting the server, access the Swagger UI at:
```
http://localhost:3000/api-docs
```

### Features of the Documentation

- Interactive API exploration
- Request and response schema examples
- Authentication support (via the "Authorize" button)
- Model definitions automatically generated from your Mongoose schemas
- Test endpoints directly from the browser

### Auto-Documentation System

The project implements two specialized utilities to automatically generate API documentation:

1. **swagger-schema-generator.js**: Extracts Swagger schema definitions directly from Mongoose models
2. **swagger-route-generator.js**: Generates API endpoint documentation by analyzing Express routes

This automatic system ensures documentation stays in sync with code changes.

## API Endpoints

### Products

- `GET /api/v1/products` - Get all products
- `GET /api/v1/products/:id` - Get product by ID
- `POST /api/v1/products` - Create a new product (with image upload)
- `PUT /api/v1/products/:id` - Update a product
- `DELETE /api/v1/products/:id` - Delete a product
- `PUT /api/v1/products/gallery-images/:id` - Upload product gallery images
- `GET /api/v1/products/get/count` - Get product count
- `GET /api/v1/products/get/featured/:count` - Get featured products

### Categories

- `GET /api/v1/categories` - Get all categories
- `GET /api/v1/categories/:id` - Get category by ID
- `POST /api/v1/categories` - Create a new category
- `PUT /api/v1/categories/:id` - Update a category
- `DELETE /api/v1/categories/:id` - Delete a category

### Users

- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Register a new user
- `POST /api/v1/users/login` - User login
- `PUT /api/v1/users/:id` - Update a user
- `DELETE /api/v1/users/:id` - Delete a user
- `GET /api/v1/users/get/count` - Get user count

### Orders

- `GET /api/v1/orders` - Get all orders
- `GET /api/v1/orders/:id` - Get order by ID
- `POST /api/v1/orders` - Create a new order
- `PUT /api/v1/orders/:id` - Update order status
- `DELETE /api/v1/orders/:id` - Delete an order
- `GET /api/v1/orders/get/count` - Get order count
- `GET /api/v1/orders/get/totalsales` - Get total sales
- `GET /api/v1/orders/get/status/:status` - Get orders by status
- `GET /api/v1/orders/get/userorders/:userId` - Get orders by user

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation
- Error handling
- Secure image upload with type validation

## Development

Run the development server with nodemon for auto-reloading:

```bash
npm run dev
```

## Testing the API

You can test the API using:

1. Swagger UI at `http://localhost:3000/api-docs`
2. Postman or similar API testing tools
3. cURL commands in the terminal
