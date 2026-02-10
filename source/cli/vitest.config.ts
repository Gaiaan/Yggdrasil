import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/bin.ts',
        'src/templates/**',
        'src/cli/**', // thin Commander.js wrappers — tested via E2E subprocess
        'src/model/types.ts', // type-only definitions — no runtime code
      ],
    },
  },
});
