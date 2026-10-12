import type { StorybookConfig } from '@storybook/vue3-vite'
import { mergeConfig } from 'vite'

const config: StorybookConfig = {
  framework: '@storybook/vue3-vite',
  stories: ['../src/**/*.stories.ts'],
  addons: [],
  // The locked storybook/test dependency uses Node's global in its browser bundle.
  viteFinal: (viteConfig) => mergeConfig(viteConfig, { define: { global: 'globalThis' } }),
}

export default config
