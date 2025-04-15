const { expressjwt: expressJwt } = require("express-jwt");

/**
 * Authentication middleware using JWT (JSON Web Token)
 * @function authJwt
 * @returns {Function} Express middleware that validates JWT tokens
 * @description Creates and configures Express JWT middleware with the following:
 *  - Uses secret key from environment variable JWT_SECRET
 *  - Uses HS256 algorithm for token verification
 *  - Implements token revocation check via isRevoked function
 *  - Excludes specific paths from authentication:
 *    - GET requests to product endpoints
 *    - GET requests to category endpoints
 *    - Login endpoint
 *    - Registration endpoint (note: there's a typo in 'regiseter')
 */
function authJwt() {
  const secret = process.env.JWT_SECRET;
  const api = process.env.API_URL;
  return expressJwt({
    secret,
    algorithms: ["HS256"],
    isRevoked: isRevoked,
  }).unless({
    path: [
      { url: /\/api-docs(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/public\/uploads(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/api\/v1\/products(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/api\/v1\/categories(.*)/, methods: ["GET", "OPTIONS"] },
      `${api}/users/login`,
      `${api}/users/regiseter`,
    ],
  });
}

async function isRevoked(req, token) {
  if (!token.payload.isAdmin) {
    return true;
  }
  return false;
}

module.exports = authJwt;
