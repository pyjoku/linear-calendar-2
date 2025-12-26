import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['tests/mocks/**', '**/*.test.ts', '**/*.config.*'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    setupFiles: ['./tests/setup.ts'],
    deps: {
      inline: ['obsidian'],
    },
  },
  resolve: {
    alias: {
      '@core': resolve(__dirname, './src/core'),
      '@infrastructure': resolve(__dirname, './src/infrastructure'),
      '@application': resolve(__dirname, './src/application'),
      '@presentation': resolve(__dirname, './src/presentation'),
      '@plugin': resolve(__dirname, './src/plugin'),
      // Mock obsidian module for tests
      obsidian: resolve(__dirname, './tests/mocks/obsidian-stub.ts'),
    },
  },
});
