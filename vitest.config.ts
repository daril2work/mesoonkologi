import { defineConfig } from 'vitest/config'
import path from 'path'

/**
 * MESO App — Vitest Configuration
 * 
 * Mirrors path aliases from vite.config.ts so that unit tests
 * can resolve imports like @features, @utils, etc.
 */
export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@store': path.resolve(__dirname, './src/store'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@configs': path.resolve(__dirname, './src/configs'),
    },
  },
})
