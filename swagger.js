const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { generateSchemasFromModels } = require('./utils/swagger-schema-generator');
const { generateSwaggerPaths } = require('./utils/swagger-route-generator');
const mongoose = require('mongoose');

// Get schemas from models
let modelSchemas = {};

try {
  // Ensure all models are loaded first
  const User = require('./models/User').User;
  const Product = require('./models/product').Product;
  const Category = require('./models/category').Category;
  const Order = require('./models/order').Order;
  const OrderItem = require('./models/orderItem').OrderItem;
  
  modelSchemas = generateSchemasFromModels();
  console.log('Swagger schemas generated from models:', Object.keys(modelSchemas));
} catch (err) {
  console.error('Error generating schemas from models:', err);
}

// Auto-generate paths from router files
let generatedPaths = {};
try {
  generatedPaths = generateSwaggerPaths();
  console.log('Swagger paths generated for routes:', Object.keys(generatedPaths).length);
} catch (err) {
  console.error('Error generating paths:', err);
}

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'E-Shop API Documentation',
    version: '1.0.0',
    description: 'RESTful API for E-Shop built with Node.js, Express, and MongoDB',
    license: {
      name: 'ISC',
      url: 'https://opensource.org/licenses/ISC',
    },
    contact: {
      name: 'API Support',
      url: 'https://e-shop-api.example.com',
      email: 'support@example.com',
    },
  },
  servers: [
    {
      url: `http://localhost:3000${process.env.API_URL || '/api/v1'}`,
      description: 'Development server',
    }
  ],
  tags: [
    {
      name: 'Users',
      description: 'User management and authentication'
    },
    {
      name: 'Products',
      description: 'Product catalog operations'
    },
    {
      name: 'Categories',
      description: 'Product category management'
    },
    {
      name: 'Orders',
      description: 'Order processing and management'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      // Auto-generated schemas from models
      ...modelSchemas,
      
      // Fallback schemas in case auto-generation fails
      // These are minimal versions that will prevent reference errors
      Product: modelSchemas.Product || {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Product ID' },
          name: { type: 'string', description: 'Product name' },
          description: { type: 'string', description: 'Product description' },
          price: { type: 'number', description: 'Product price' }
        }
      },
      Category: modelSchemas.Category || {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Category ID' },
          name: { type: 'string', description: 'Category name' },
        }
      },
      User: modelSchemas.User || {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'User ID' },
          name: { type: 'string', description: 'User name' },
          email: { type: 'string', description: 'User email' },
        }
      },
      Order: modelSchemas.Order || {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Order ID' },
          status: { type: 'string', description: 'Order status' },
          totalPrice: { type: 'number', description: 'Total order price' },
        }
      },
      OrderItem: modelSchemas.OrderItem || {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'OrderItem ID' },
          product: { type: 'string', description: 'Product reference' },
          quantity: { type: 'number', description: 'Quantity' },
        }
      },
      
      // Always include Error schema
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Access token is missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              message: 'Unauthorized',
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              message: 'Resource not found',
            },
          },
        },
      },
      ServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              message: 'Server error',
            },
          },
        },
      },
    },
  },
  // Auto-generated paths
  paths: generatedPaths,
  security: [
    {
      bearerAuth: [],
    },
  ],
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  // We still include this for any manual annotations you might want to add
  apis: ['./routers/*.js'],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

// Add any additional paths from JSDoc annotations in router files
// This allows mixing automatic and manual documentation
const swaggerDocument = swaggerSpec;

module.exports = {
  swaggerServe: swaggerUi.serve,
  swaggerSetup: swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
  }),
};