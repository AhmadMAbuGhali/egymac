/**
 * Simple admin API key guard.
 * Set ADMIN_API_KEY in environment; defaults to egymac-admin-dev for local dev.
 */
const ADMIN_KEY = process.env.ADMIN_API_KEY || "egymac-admin-dev";

export function requireAdmin(req, res, next) {
  const key = req.headers["x-admin-key"];

  if (!key || key !== ADMIN_KEY) {
    return res.status(401).json({ success: false, message: "Unauthorized — invalid admin key" });
  }

  next();
}

export { ADMIN_KEY };
