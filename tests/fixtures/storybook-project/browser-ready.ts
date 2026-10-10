import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
try {
  console.log(JSON.stringify({ ready: true, executable: chromium.executablePath() }));
} finally {
  await browser.close();
}
