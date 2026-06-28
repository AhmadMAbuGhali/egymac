import { IS_SERVERLESS } from "./runtimePaths.js";

const MAX_CONCURRENT_PAGES = Math.max(1, Number(process.env.PDF_MAX_CONCURRENT) || 2);
const PDF_TIMEOUT_MS = Number(process.env.PDF_TIMEOUT_MS) || 120_000;

let browserInstance = null;
let activePages = 0;
const waitQueue = [];
let puppeteerModule = null;

async function loadPuppeteer() {
  if (!puppeteerModule) {
    puppeteerModule = IS_SERVERLESS
      ? (await import("puppeteer-core")).default
      : (await import("puppeteer")).default;
  }
  return puppeteerModule;
}

async function getLaunchOptions() {
  if (IS_SERVERLESS) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return {
      args: [...chromium.args, "--disable-dev-shm-usage"],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    };
  }

  return {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--font-render-hinting=none",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  };
}

async function getBrowser() {
  if (browserInstance?.connected) return browserInstance;

  const puppeteer = await loadPuppeteer();
  browserInstance = await puppeteer.launch(await getLaunchOptions());

  browserInstance.on("disconnected", () => {
    browserInstance = null;
  });

  return browserInstance;
}

function acquireSlot() {
  if (activePages < MAX_CONCURRENT_PAGES) {
    activePages += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => waitQueue.push(resolve));
}

function releaseSlot() {
  activePages = Math.max(0, activePages - 1);
  const next = waitQueue.shift();
  if (next) {
    activePages += 1;
    next();
  }
}

/**
 * Run a PDF generation job with bounded concurrency and guaranteed page cleanup.
 */
export async function withPdfPage(run) {
  await acquireSlot();
  let page = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    page.setDefaultTimeout(PDF_TIMEOUT_MS);
    return await run(page);
  } finally {
    if (page) {
      try {
        await page.close();
      } catch {
        /* page may already be closed if browser crashed */
      }
    }
    releaseSlot();
  }
}

export async function closePdfBrowser() {
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch {
      /* ignore */
    }
    browserInstance = null;
  }
}

export { PDF_TIMEOUT_MS };
