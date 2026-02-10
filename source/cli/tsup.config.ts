import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/bin.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'dist',
  clean: true,
  dts: true,
  sourcemap: true,
  splitting: false,
  // Copy templates to dist (must run after build; rm ensures clean copy)
  onSuccess: 'rm -rf dist/templates && cp -r src/templates dist/templates',
});
