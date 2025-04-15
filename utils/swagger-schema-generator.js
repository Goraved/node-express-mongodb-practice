const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

/**
 * Converts Mongoose schema types to OpenAPI/Swagger types
 * @param {*} schemaType - Mongoose schema type
 * @returns {Object} - OpenAPI type definition
 */
function convertMongooseTypeToSwagger(schemaType) {
  if (!schemaType) return { type: 'string' };
  
  // Handle array type
  if (schemaType.instance === 'Array') {
    // If it's an array of references, handle specially
    if (schemaType.schema && schemaType.schema.obj && schemaType.schema.obj.type && 
        schemaType.schema.obj.type.ref) {
      return {
        type: 'array',
        items: {
          type: 'string',
          description: `Reference to ${schemaType.schema.obj.type.ref}`
        }
      };
    }
    
    const itemType = schemaType.caster ? 
      convertMongooseTypeToSwagger(schemaType.caster) : 
      { type: 'string' };
      
    return {
      type: 'array',
      items: itemType
    };
  }
  
  // Map Mongoose types to OpenAPI types
  const typeMap = {
    'String': { type: 'string' },
    'Number': { type: 'number' },
    'Date': { type: 'string', format: 'date-time' },
    'Boolean': { type: 'boolean' },
    'ObjectID': { type: 'string' },
    'Mixed': { type: 'object' },
    'Buffer': { type: 'string', format: 'binary' },
    'Map': { type: 'object' },
    'Decimal128': { type: 'number' }
  };
  
  return typeMap[schemaType.instance] || { type: 'string' };
}

/**
 * Safely extracts schema from Mongoose model without recompiling it
 * @param {Object} model - Mongoose model instance
 * @returns {Object|null} - OpenAPI schema object or null if no model found
 */
function extractModelSchema(model) {
  if (!model || !model.schema) return null;
  
  const properties = {};
  const schema = model.schema;
  
  // Add ID property which isn't explicitly in the schema
  properties.id = { type: 'string', description: 'MongoDB ObjectId' };
  
  // Process each path in the schema
  Object.keys(schema.paths).forEach(path => {
    // Skip internal mongoose fields
    if (path === '__v' || path === '_id') return;
    
    const schemaType = schema.paths[path];
    
    // Get field type info
    const fieldInfo = convertMongooseTypeToSwagger(schemaType);
    
    // Add additional validation info if available
    if (schemaType.validators && schemaType.validators.length > 0) {
      schemaType.validators.forEach(validator => {
        if (validator.type === 'min') fieldInfo.minimum = validator.min;
        if (validator.type === 'max') fieldInfo.maximum = validator.max;
        if (validator.type === 'enum') fieldInfo.enum = validator.enumValues;
      });
    }
    
    // Add pattern from regexp if available
    if (schemaType.regExp) {
      fieldInfo.pattern = schemaType.regExp.toString().slice(1, -1);
    }
    
    // Handle references to other models (ObjectId refs)
    if (schemaType.options && schemaType.options.ref) {
      fieldInfo.description = `Reference to ${schemaType.options.ref} model`;
    }
    
    properties[path] = fieldInfo;
  });
  
  return {
    type: 'object',
    properties: properties
  };
}

/**
 * Loads all models from models directory and generates schemas without recompiling models
 * @returns {Object} - Map of model names to their OpenAPI schemas
 */
function generateSchemasFromModels() {
  const schemas = {};
  const modelsDir = path.join(__dirname, '../models');
  
  try {
    // First, ensure all models are loaded to prevent reference issues
    const modelFiles = fs.readdirSync(modelsDir)
      .filter(file => file.endsWith('.js') && !file.startsWith('.'));
    
    // Just require all model files first to ensure they're loaded
    modelFiles.forEach(file => {
      try {
        require(path.join(modelsDir, file));
      } catch (err) {
        console.error(`Error pre-loading model ${file}:`, err.message);
      }
    });
    
    // Now extract schemas from the loaded models
    Object.keys(mongoose.models).forEach(modelName => {
      try {
        const model = mongoose.models[modelName];
        const schema = extractModelSchema(model);
        if (schema) {
          schemas[modelName] = schema;
        }
      } catch (err) {
        console.error(`Error processing model ${modelName}:`, err.message);
      }
    });
    
  } catch (err) {
    console.error('Error reading models directory:', err);
  }
  
  return schemas;
}

module.exports = {
  generateSchemasFromModels
};