import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      lines: 100,
      branches: 95,
      statements: 100,
    },
  },
});
