import express from "express";
import cors from "cors";
import catalogRouter from "./routes/catalog.js";
import siteTextsRouter from "./routes/siteTexts.js";
import siteContentRouter from "./routes/siteContent.js";
import inquiriesRouter from "./routes/inquiries.js";
import quotationRouter from "./routes/quotation.js";
import quotationsRouter from "./routes/quotations.js";
import salespersonsRouter from "./routes/salespersons.js";
import templatesRouter from "./routes/templates.js";

/** Vercel mounts this service at /_/backend; local dev uses bare /api paths. */
export const API_MOUNT = process.env.API_MOUNT_PREFIX ?? (process.env.VERCEL ? "/_/backend" : "");

const defaultOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

export function createApp() {
  const app = express();

  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
    : defaultOrigins;

  app.use(
    cors({
      origin: process.env.VERCEL ? true : corsOrigins,
      credentials: true,
    })
  );
  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: process.env.JSON_BODY_LIMIT || "50mb" }));

  app.use((err, req, res, next) => {
    if (err?.type === "entity.too.large") {
      return res.status(413).json({
        success: false,
        message:
          "Request payload too large. Reduce embedded image sizes or increase JSON_BODY_LIMIT on the server.",
      });
    }
    next(err);
  });

  const api = express.Router();
  api.use("/catalog", catalogRouter);
  api.use("/site-texts", siteTextsRouter);
  api.use("/site-content", siteContentRouter);
  api.use("/inquiries", inquiriesRouter);
  api.use("/quotation", quotationRouter);
  api.use("/quotations", quotationsRouter);
  api.use("/salespersons", salespersonsRouter);
  api.use("/templates", templatesRouter);
  api.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "egymac-api", timestamp: new Date().toISOString() });
  });

  app.use(`${API_MOUNT}/api`, api);

  app.use((_req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
  });

  return app;
}
