import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseURL = 'http://localhost:8765';
const routes = ['/answers/','/guides/2-activate/','/guides/3-usage/','/more/03-esim/','/more/04-esim-qrcode/'];
const viewports = [
  { label: 'desktop', width: 1280, height: 900 },
  { label: 'mobile', width: 390, height: 844 },
];
const outDir = path.join(__dirname, '..', '.screenshots');
await import('node:fs/promises').then(fs => fs.mkdir(outDir, { recursive: true }));
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
for (const route of routes) {
  const name = route.replace(/\//g, '_').replace(/^_/, '').replace(/_$/, '') || 'home';
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    await page.goto(baseURL + route, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(outDir, `${name}-${viewport.label}.png`) });
    await page.close();
  }
}
await browser.close();
console.log('done');
