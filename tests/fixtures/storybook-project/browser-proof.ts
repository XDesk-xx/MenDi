import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const [directory, expectedLabel, previewUrl] = process.argv.slice(2);
assert.ok(directory && expectedLabel);
fs.mkdirSync(directory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 580 } });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    previewUrl ?? 'http://127.0.0.1:6113/iframe.html?id=proof-counter--basic&viewMode=story',
  );
  const surface =
    previewUrl && new URL(previewUrl).searchParams.has('path')
      ? page.frameLocator('#storybook-preview-iframe')
      : page;
  await surface
    .getByRole('status')
    .filter({ hasText: expectedLabel + '2' })
    .waitFor();
  const before = await surface.getByRole('status').innerText();
  await surface.getByRole('button', { name: '增加' }).click();
  const after = await surface.getByRole('status').innerText();
  assert.equal(before, expectedLabel + '2');
  assert.equal(after, expectedLabel + '3');
  const screenshot = path.join(directory, 'counter.png');
  await page.screenshot({ path: screenshot });
  await page.goto('http://127.0.0.1:6113/iframe.html?id=proof-counter--disabled&viewMode=story');
  await page.getByRole('status').waitFor();
  assert.equal(await page.getByRole('button', { name: '增加' }).isDisabled(), true);
  assert.equal(await page.getByRole('status').innerText(), expectedLabel + '0');
  assert.deepEqual(errors, []);
  const result = { before, after, disabled: true, pageErrors: errors, screenshot };
  fs.writeFileSync(path.join(directory, 'browser.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
