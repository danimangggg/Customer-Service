/**
 * Extracts branch_code from request headers and attaches it to req.
 * Frontend must send: X-Branch-Code header on every API call.
 * If no branch_code is present, req.branchCode will be null (super-admin can see all).
 */
const branchMiddleware = (req, res, next) => {
  req.branchCode = req.headers['x-branch-code'] || null;
  next();
};

module.exports = branchMiddleware;
