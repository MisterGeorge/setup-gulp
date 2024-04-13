/// <reference types="vitest" />
/// <reference types="vite/client" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/assets/**',
      './gulpfile.js'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        '**/__tests__/**',
        '**/assets/**',
        './gulpfile.js'
      ]
    },
    environment: 'jsdom',
    globals: true
  },
})