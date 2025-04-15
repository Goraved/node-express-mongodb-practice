const e = require("express");

/**
 * Express middleware for centralized error handling.
 * Handles different types of errors and returns appropriate HTTP responses with error messages.
 *
 * @param {Error} err - The error object caught by Express
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 * @returns {import('express').Response} Response object with appropriate status code and error message
 *
 * @example
 * // In your Express app setup:
 * app.use(errorHandler);
 *
 * @throws {Error} Returns a 401 status for authentication errors (UnauthorizedError, JsonWebTokenError, TokenExpiredError)
 * @throws {Error} Returns a 404 status for NotFoundError
 * @throws {Error} Returns a 400 status for validation errors, cast errors, duplicate keys, and other client-side errors
 * @throws {Error} Returns a 500 status for all other unhandled errors
 */
function errorHandler(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (err.name === "NotFoundError") {
    return res.status(404).json({ message: "Resource not found" });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID format" });
  }
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token" });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token expired" });
  }
  if (err.name === "MongoError" && err.code === 11000) {
    return res.status(400).json({ message: "Duplicate key error" });
  }
  if (err.name === "MulterError") {
    return res.status(400).json({ message: err.message });
  }
  if (err.name === "SyntaxError") {
    return res.status(400).json({ message: "Invalid JSON format" });
  }
  if (err.name === "RangeError") {
    return res.status(400).json({ message: "Range error" });
  }
  if (err.name === "TypeError") {
    return res.status(400).json({ message: "Type error", error: err });
  }
  if (err.name === "ReferenceError") {
    return res.status(400).json({ message: "Reference error" });
  }

  return res.status(500).json({ message: err });
}

module.exports = errorHandler;
