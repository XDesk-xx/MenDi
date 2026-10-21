import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

const targetRoot = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  root: targetRoot,
  test: {
    projects: [
      {
        define: { global: 'globalThis' },
        plugins: [storybookTest({ configDir: path.join(targetRoot, '.storybook') })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            api: { host: '127.0.0.1', port: 64115, strictPort: true },
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
