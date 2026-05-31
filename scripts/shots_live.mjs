import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 }, args: ["--no-sandbox","--hide-scrollbars"] });
const page = await browser.newPage();
const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0,120)); });
page.on("pageerror", (e) => errs.push("PAGEERR: " + String(e).slice(0,120)));
await page.goto("https://sumanthkm.com/aria/", { waitUntil: "networkidle2", timeout: 45000 });
await sleep(6000); // boot
await page.screenshot({ path: "public/screenshots/21-live-sumanthkm.png" });
const booted = await page.evaluate(() => !!document.querySelector('[data-dock-item]'));
console.log("dock rendered (booted):", booted);
console.log("console errors:", errs.length ? errs.slice(0,5) : "none");
await browser.close();
