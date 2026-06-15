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
import { closePdfBrowser } from "./utils/generateFreeFormQuotePdf.js";

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));
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

app.use("/api/catalog", catalogRouter);
app.use("/api/site-texts", siteTextsRouter);
app.use("/api/site-content", siteContentRouter);
app.use("/api/inquiries", inquiriesRouter);
app.use("/api/quotation", quotationRouter);
app.use("/api/quotations", quotationsRouter);
app.use("/api/salespersons", salespersonsRouter);
app.use("/api/templates", templatesRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "egymac-api", timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

const server = app.listen(PORT, () => {
  console.log(`\n⚙️  Egy Mac API → http://localhost:${PORT}`);
  console.log(`    Catalog     GET                 /api/catalog`);
    console.log(`    Catalog     CRUD                /api/catalog/categories | /products | /production-lines | /molds`);
  console.log(`    Site Texts  GET/PUT             /api/site-texts`);
  console.log(`    Site CMS    GET/POST            /api/site-content`);
  console.log(`    Inquiries   POST/GET            /api/inquiries`);
  console.log(`    Free Offers  POST/GET            /api/quotations/*`);
  console.log(`    Templates    GET/POST/DELETE     /api/templates`);
    console.log(`    PDF Export   GET                 /api/quotations/:id/pdf?printMode=…`);
    console.log(`    PDF Export   POST                /api/quotations/generate-pdf { id }`);
  console.log(`    Admin Key   X-Admin-Key header (default: egymac-admin-dev)\n`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`   Stop the other process: lsof -i :${PORT}  then  kill <PID>`);
    console.error(`   Or run on another port: PORT=5002 npm run dev\n`);
    process.exit(1);
  }
  throw err;
});

function shutdown(signal) {
  console.log(`\n${signal} received — closing server…`);
  closePdfBrowser()
    .catch(() => {})
    .finally(() => {
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(0), 2000).unref();
    });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
