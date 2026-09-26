import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js', 'tools/**/*.js'],
      reporter: ['text', 'html'],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
});
