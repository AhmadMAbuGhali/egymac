/** Hide internal error details from public API responses in production. */

const DEFAULT_MESSAGE = "An unexpected error occurred. Please try again later.";

export function publicErrorMessage(err, fallback = DEFAULT_MESSAGE) {
  if (err?.expose === true && err?.message) return err.message;
  if (process.env.NODE_ENV !== "production") return err?.message || fallback;
  return fallback;
}

export function sendError(res, err, status = 500) {
  if (status >= 500) console.error("[api]", err);
  return res.status(status).json({ success: false, message: publicErrorMessage(err) });
}
