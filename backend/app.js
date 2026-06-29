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
import seoRouter from "./routes/seo.js";
import { getJsonStorageBackend } from "./utils/jsonStore.js";
import {
  getStorageDiagnostics,
  hasPersistentStorage,
  storageSetupHint,
} from "./utils/persistentStorage.js";
import { probeBlobAuth, probeBlobRoundTrip } from "./utils/blobStorage.js";
import { oidcContextMiddleware } from "./utils/requestOidc.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { isValidAdminKey } from "./middleware/adminAuth.js";

/** Public URL prefix for this service on Vercel (see vercel.json routePrefix). */
export const SERVICE_ROUTE_PREFIX =
  process.env.SERVICE_ROUTE_PREFIX || process.env.API_MOUNT_PREFIX || "/_/backend";

const defaultOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

export function createApp() {
  const app = express();

  if (process.env.VERCEL) {
    app.set("trust proxy", 1);
  }

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
  app.use(oidcContextMiddleware);

  /**
   * Normalize paths from Vercel Services routing.
   * External: /_/backend/api/site-content
   * Express may receive either the full path or a stripped /api/... path.
   */
  app.use((req, _res, next) => {
    const prefix = SERVICE_ROUTE_PREFIX;
    if (prefix && prefix !== "/" && (req.url === prefix || req.url.startsWith(`${prefix}/`))) {
      req.url = req.url.slice(prefix.length) || "/";
    }
    next();
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
  api.use("/seo", seoRouter);
  api.get("/health", async (req, res) => {
    const adminView = isValidAdminKey(req.headers["x-admin-key"]);
    const payload = {
      status: "ok",
      service: "egymac-api",
      timestamp: new Date().toISOString(),
    };

    if (adminView) {
      const blobAuth = await probeBlobAuth();
      const blobRoundTrip = await probeBlobRoundTrip();
      Object.assign(payload, {
        mount: "/api",
        storage: getJsonStorageBackend(),
        persistent: hasPersistentStorage() && blobRoundTrip.ok,
        diagnostics: getStorageDiagnostics({ blobAuth, blobRoundTrip }),
        setupHint: blobRoundTrip.ok
          ? storageSetupHint()
          : "Blob storage is connected but read/write failed. Add BLOB_READ_WRITE_TOKEN in Vercel project settings and redeploy.",
      });
    }

    res.json(payload);
  });

  // Mount once at /api — prefix strip middleware handles /_/backend/... requests.
  app.use("/api", api);
  // Fallback: some runtimes pass the full prefixed path without stripping.
  if (SERVICE_ROUTE_PREFIX && SERVICE_ROUTE_PREFIX !== "/") {
    app.use(`${SERVICE_ROUTE_PREFIX}/api`, api);
  }

  app.use((_req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
  });

  app.use(errorHandler);

  return app;
}
