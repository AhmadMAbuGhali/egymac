/**
 * Simple admin API key guard.
 * Override with ADMIN_API_KEY in environment (see vercel.json / backend/.env.example).
 */
const ADMIN_KEY = process.env.ADMIN_API_KEY || "egymac123@";

export function requireAdmin(req, res, next) {
  const key = req.headers["x-admin-key"];

  if (!key || key !== ADMIN_KEY) {
    return res.status(401).json({ success: false, message: "Unauthorized — invalid admin key" });
  }

  next();
}

export { ADMIN_KEY };
