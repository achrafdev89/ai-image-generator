const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const APP_URL = "https://visionforge-ash.netlify.app/";

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function main() {
  const screenshotsDir = path.join(process.cwd(), "screenshots");
  ensureDir(screenshotsDir);

  const browser = await chromium.launch({ headless: true });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 }
  });

  await page.goto(APP_URL, { waitUntil: "networkidle" });
  await page.screenshot({
    path: path.join(screenshotsDir, "home.png"),
    fullPage: true
  });

  await page.fill("#prompt", "A futuristic AI robot creating digital art in a neon studio, cinematic lighting, 3D render, ultra detailed");
  await page.selectOption("#style", "3D render");
  await page.click(".generate-btn");

  await page.waitForSelector("#generatedImage:not(.hidden)", {
    timeout: 90000
  });

  await page.screenshot({
    path: path.join(screenshotsDir, "generator.png"),
    fullPage: true
  });

  await page.screenshot({
    path: path.join(screenshotsDir, "gallery.png"),
    fullPage: true
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(APP_URL, { waitUntil: "networkidle" });
  await page.screenshot({
    path: path.join(screenshotsDir, "mobile.png"),
    fullPage: true
  });

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});