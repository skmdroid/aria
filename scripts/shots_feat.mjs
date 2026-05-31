import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "public/screenshots";
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  defaultViewport: { width: 1512, height: 944, deviceScaleFactor: 2 },
  args: ["--no-sandbox", "--hide-scrollbars", "--force-color-profile=srgb"],
});
const page = await browser.newPage();
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` }).then(() => console.log("✓", n));

await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });
await sleep(4800); // boot

// memory proof
await page.click('[data-dock-item="assistant"]');
await page.waitForSelector("textarea");
const say = async (t) => {
  await page.click("textarea");
  await page.type("textarea", t, { delay: 6 });
  await page.keyboard.press("Enter");
  await sleep(2200);
};
await say("Hi, my name is Sam");
await say("what's my name?");
await sleep(500);
await shot("09-memory");

// voice mode orb (click the menubar voice button)
await page.click('button[title="Voice mode"]');
await sleep(1400);
await shot("10-voice");

await browser.close();
console.log("done");
