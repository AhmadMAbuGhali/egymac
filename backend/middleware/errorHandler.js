import { publicErrorMessage } from "../utils/safeError.js";

/** Catch unhandled errors (e.g. Multer) after routes. */
export function errorHandler(err, req, res, _next) {
  if (res.headersSent) return;

  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message:
        "Request payload too large. Reduce embedded image sizes or contact support.",
    });
  }

  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "Uploaded file is too large.",
    });
  }

  if (err?.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      message: "Unexpected file field in upload.",
    });
  }

  console.error("[api] unhandled", err);
  res.status(err.status || err.statusCode || 500).json({
    success: false,
    message: publicErrorMessage(err),
  });
}
