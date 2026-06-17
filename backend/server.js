import { createApp, API_MOUNT } from "./app.js";

const app = createApp();
const PORT = process.env.PORT || 5001;

export default app;

if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`\n⚙️  Egy Mac API → http://localhost:${PORT}`);
    console.log(`    Health      GET                 ${API_MOUNT || ""}/api/health`);
    console.log(`    Catalog     GET                 ${API_MOUNT || ""}/api/catalog`);
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
    import("./utils/generateFreeFormQuotePdf.js")
      .then(({ closePdfBrowser }) => closePdfBrowser())
      .catch(() => {})
      .finally(() => {
        server.close(() => process.exit(0));
        setTimeout(() => process.exit(0), 2000).unref();
      });
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
