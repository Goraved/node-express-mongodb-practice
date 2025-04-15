const path = require('path');
const fs = require('fs');

/**
 * Extract route path parameters
 * @param {string} path - Express route path
 * @returns {Array} - Array of parameter objects
 */
function extractPathParams(routePath) {
  const params = [];
  const pathParamRegex = /:([^\/]+)/g;
  let match;
  
  while ((match = pathParamRegex.exec(routePath)) !== null) {
    params.push({
      name: match[1],
      in: 'path',
      required: true,
      schema: {
        type: 'string'
      }
    });
  }
  
  return params;
}

/**
 * Generate operation ID from route path and method
 * @param {string} path - Route path
 * @param {string} method - HTTP method
 * @returns {string} - Operation ID
 */
function generateOperationId(routePath, method) {
  // Clean up path for operation ID
  const pathParts = routePath
    .replace(/^\/|\/$/g, '') // Remove leading/trailing slashes
    .replace(/\//g, '_')     // Replace / with _
    .replace(/:/g, '')       // Remove : from path params
    .replace(/-/g, '_')      // Replace - with _
    .split('_')
    .filter(p => p !== '');  // Remove empty parts
    
  // Create camelCase operationId
  const methodPrefix = method.toLowerCase();
  if (pathParts.length === 0) {
    return `${methodPrefix}Root`;
  }
  
  // Handle special cases like "get/count"
  if (pathParts.includes('get') && pathParts.length > 1) {
    // For endpoints like /get/count or /get/featured
    return `${methodPrefix}${pathParts[1].charAt(0).toUpperCase() + pathParts[1].slice(1)}`;
  }
  
  return methodPrefix + pathParts.map((p, i) => {
    return i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1);
  }).join('');
}

/**
 * Generate tag from router file name
 * @param {string} routerFile - Router file name
 * @returns {string} - Tag name
 */
function generateTag(routerFile) {
  const name = path.basename(routerFile, '.js');
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Determine response schema for a route
 * @param {string} path - Route path
 * @param {string} method - HTTP method
 * @param {string} tag - Route tag
 * @returns {Object} - Response schema object
 */
function determineResponseSchema(routePath, method, tag) {
  // Default success response
  let successResponse = {
    description: 'Successful operation',
    content: {
      'application/json': {
        schema: {}
      }
    }
  };
  
  // Default error responses
  const errorResponses = {
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' }
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: {
      description: 'Server error',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' }
        }
      }
    }
  };
  
  // Detect resource type from path and tag
  const singularTag = tag.endsWith('s') ? tag.slice(0, -1) : tag; // Remove 's' to get singular
  
  // Handle GET list endpoints
  if (method === 'get' && (routePath === '/' || routePath === '')) {
    successResponse.description = `List of ${tag}`;
    successResponse.content['application/json'].schema = {
      type: 'array',
      items: { $ref: `#/components/schemas/${singularTag}` }
    };
  } 
  // Handle GET by ID
  else if (method === 'get' && routePath.includes('/:id')) {
    successResponse.description = `${singularTag} details`;
    successResponse.content['application/json'].schema = {
      $ref: `#/components/schemas/${singularTag}`
    };
  }
  // Handle GET count endpoints
  else if (method === 'get' && routePath.includes('/count')) {
    successResponse.description = `${singularTag} count`;
    successResponse.content['application/json'].schema = {
      type: 'object',
      properties: {
        count: { type: 'integer', example: 42 }
      }
    };
  }
  // Handle POST endpoints (create)
  else if (method === 'post' && (routePath === '/' || routePath === '')) {
    successResponse.description = `Created ${singularTag}`;
    successResponse.content['application/json'].schema = {
      $ref: `#/components/schemas/${singularTag}`
    };
  }
  // Handle PUT endpoints (update)
  else if (method === 'put' && routePath.includes('/:id')) {
    successResponse.description = `Updated ${singularTag}`;
    successResponse.content['application/json'].schema = {
      $ref: `#/components/schemas/${singularTag}`
    };
  }
  // Handle DELETE endpoints
  else if (method === 'delete' && routePath.includes('/:id')) {
    successResponse.description = `${singularTag} deleted`;
    successResponse.content['application/json'].schema = {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: `${singularTag} deleted successfully` }
      }
    };
  }
  // Handle special case for login
  else if (method === 'post' && routePath.includes('/login')) {
    successResponse.description = 'Login successful';
    successResponse.content['application/json'].schema = {
      type: 'object',
      properties: {
        user: { type: 'string', example: 'user@example.com' },
        token: { type: 'string', example: 'eyJhbGciOiJIUzI1...' }
      }
    };
  }
  
  return {
    200: successResponse,
    ...errorResponses
  };
}

/**
 * Determine request body schema for a route
 * @param {string} path - Route path
 * @param {string} method - HTTP method
 * @param {string} tag - Route tag
 * @returns {Object|null} - Request body schema object or null if no body
 */
function determineRequestBody(routePath, method, tag) {
  // No request body for GET and DELETE operations
  if (method === 'get' || method === 'delete') {
    return null;
  }
  
  // Detect resource type from tag
  const singularTag = tag.endsWith('s') ? tag.slice(0, -1) : tag; // Remove 's' to get singular
  
  // For file uploads in products
  if (tag === 'Products' && (routePath.includes('gallery-images') || method === 'post' || method === 'put')) {
    return {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              image: {
                type: 'string',
                format: 'binary',
                description: 'Product image file'
              },
              // Add other properties based on your model
            }
          }
        }
      }
    };
  }
  
  // For login
  if (routePath.includes('/login')) {
    return {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: { 
                type: 'string', 
                format: 'email',
                example: 'user@example.com'
              },
              password: { 
                type: 'string', 
                format: 'password',
                example: 'password123'
              }
            }
          }
        }
      }
    };
  }
  
  // Default for other POST and PUT operations
  return {
    required: true,
    content: {
      'application/json': {
        schema: {
          $ref: `#/components/schemas/${singularTag}`
        }
      }
    }
  };
}

/**
 * Generate Swagger paths from Express routers
 * @returns {Object} - Swagger paths object
 */
function generateSwaggerPaths() {
  const routersDir = path.join(__dirname, '../routers');
  const paths = {};
  const securedPaths = ['post', 'put', 'delete']; // Methods that require authentication
  
  try {
    // Read routers directory
    const routerFiles = fs.readdirSync(routersDir)
      .filter(file => file.endsWith('.js') && !file.startsWith('.'));
    
    // Process each router file
    routerFiles.forEach(routerFile => {
      try {
        const router = require(path.join(routersDir, routerFile));
        const tag = generateTag(routerFile);
        const baseUrl = `/${path.basename(routerFile, '.js')}`;
        
        // Access the internal stack of the router to extract routes
        const stack = router.stack || [];
        
        stack.forEach(layer => {
          if (!layer.route) return; // Skip middleware that are not routes
          
          const route = layer.route;
          const routePath = baseUrl + (route.path === '/' ? '' : route.path);
          
          // Process each method for the route (GET, POST, etc.)
          Object.keys(route.methods).forEach(method => {
            const methodName = method.toLowerCase();
            const operationId = generateOperationId(route.path, methodName);
            const parameters = extractPathParams(route.path);
            const responses = determineResponseSchema(route.path, methodName, tag);
            const requestBody = determineRequestBody(route.path, methodName, tag);
            
            // Prepare path object for Swagger
            const pathObj = {
              tags: [tag],
              summary: `${methodName.toUpperCase()} ${routePath}`,
              description: `${methodName.toUpperCase()} operation for ${routePath}`,
              operationId,
              parameters,
              responses
            };
            
            // Add security for secured methods
            if (securedPaths.includes(methodName)) {
              pathObj.security = [{ bearerAuth: [] }];
            }
            
            // Add request body if applicable
            if (requestBody) {
              pathObj.requestBody = requestBody;
            }
            
            // Add to paths
            paths[routePath] = paths[routePath] || {};
            paths[routePath][methodName] = pathObj;
          });
        });
      } catch (error) {
        console.error(`Error processing router ${routerFile}:`, error);
      }
    });
  } catch (error) {
    console.error('Error reading routers directory:', error);
  }
  
  return paths;
}

module.exports = {
  generateSwaggerPaths
};