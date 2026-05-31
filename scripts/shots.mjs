import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = "http://localhost:3000";
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
const shot = async (name) => {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log("✓", name);
};
const dock = async (id) => {
  await page.click(`[data-dock-item="${id}"]`);
  await sleep(900);
};

await page.goto(URL, { waitUntil: "networkidle2" });
await sleep(1500);
await shot("01-boot");
await sleep(3400); // boot finishes → clean desktop with widgets
await shot("00-desktop-clean");

// dispatch a mission from the dock → assistant
await dock("assistant");
await page.waitForSelector("textarea");
await page.click("textarea");
await page.type("textarea", "Research and compare the best AI coding assistants in 2025", { delay: 8 });
await page.keyboard.press("Enter");
await sleep(3800);
await shot("03-agents-running");
await sleep(9000);
await shot("02-desktop");

await dock("dashboard");
await sleep(1800);
await shot("04-dashboard");

await dock("terminal");
await sleep(400);
await page.mouse.click(760, 480);
await sleep(150);
for (const c of ["neofetch", "agents", "files"]) {
  await page.keyboard.type(c, { delay: 10 });
  await page.keyboard.press("Enter");
  await sleep(250);
}
await shot("05-terminal");

await dock("files");
await sleep(900);
await shot("06-files");

await page.click('[data-dock-item="spotlight"]');
await sleep(450);
await page.type('input[placeholder^="Search apps"]', "research the best mechanical keyboards", { delay: 10 });
await sleep(650);
await shot("07-spotlight");
await page.keyboard.press("Escape");
await sleep(250);

await dock("settings");
await sleep(900);
await shot("08-settings");

await browser.close();
console.log("done");
