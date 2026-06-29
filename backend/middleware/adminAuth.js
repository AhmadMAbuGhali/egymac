/**
 * Simple admin API key guard.
 * Set ADMIN_API_KEY in Vercel project env (Production + Preview).
 */
const DEV_FALLBACK_KEY = "egymac123@";
const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
const ADMIN_KEY = process.env.ADMIN_API_KEY || (isProd ? "" : DEV_FALLBACK_KEY);

if (isProd && !process.env.ADMIN_API_KEY) {
  console.error("[adminAuth] ADMIN_API_KEY is not set — admin routes will reject all requests.");
}

export function requireAdmin(req, res, next) {
  if (!ADMIN_KEY) {
    return res.status(503).json({
      success: false,
      message: "Admin access is not configured on this server.",
    });
  }

  const key = req.headers["x-admin-key"];
  if (!key || key !== ADMIN_KEY) {
    return res.status(401).json({ success: false, message: "Unauthorized — invalid admin key" });
  }

  next();
}

export function isValidAdminKey(key) {
  return Boolean(ADMIN_KEY && key && key === ADMIN_KEY);
}

export { ADMIN_KEY };
