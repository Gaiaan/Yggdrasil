import { describe, it, expect } from 'vitest';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findYggRoot, normalizeMappingPaths, toGraphPath } from '../../../src/utils/paths.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PROJECT = path.join(__dirname, '../../fixtures/sample-project');

describe('paths', () => {
  describe('findYggRoot', () => {
    it('returns .yggdrasil path when it exists', async () => {
      const yggRoot = await findYggRoot(FIXTURE_PROJECT);
      expect(yggRoot).toContain('.yggdrasil');
      expect(yggRoot.endsWith('.yggdrasil')).toBe(true);
    });

    it('throws when .yggdrasil directory does not exist', async () => {
      await expect(findYggRoot('/nonexistent/path')).rejects.toThrow(
        'No .yggdrasil/ directory found',
      );
    });
  });

  describe('normalizeMappingPaths', () => {
    it('returns empty array when mapping is undefined', () => {
      expect(normalizeMappingPaths(undefined)).toEqual([]);
    });

    it('returns single path as array when path is string', () => {
      expect(normalizeMappingPaths({ path: 'src/module.ts' })).toEqual(['src/module.ts']);
    });

    it('returns paths as-is when path is array', () => {
      expect(
        normalizeMappingPaths({
          path: ['src/a.ts', 'src/b.ts'],
        }),
      ).toEqual(['src/a.ts', 'src/b.ts']);
    });
  });

  describe('toGraphPath', () => {
    it('converts absolute path to graph path', () => {
      const yggRoot = path.join(FIXTURE_PROJECT, '.yggdrasil');
      const absPath = path.join(yggRoot, 'orders', 'order-service');
      expect(toGraphPath(absPath, yggRoot)).toBe('orders/order-service');
    });

    it('handles single segment', () => {
      const yggRoot = '/proj/.yggdrasil';
      const absPath = '/proj/.yggdrasil/auth';
      expect(toGraphPath(absPath, yggRoot)).toBe('auth');
    });

    it('handles deeply nested paths', () => {
      const yggRoot = '/proj/.yggdrasil';
      const absPath = '/proj/.yggdrasil/a/b/c/d';
      expect(toGraphPath(absPath, yggRoot)).toBe('a/b/c/d');
    });
  });

  describe('getPackageRoot', () => {
    it('returns a string path', async () => {
      const { getPackageRoot } = await import('../../../src/utils/paths.js');
      const root = getPackageRoot();
      expect(typeof root).toBe('string');
      expect(root.length).toBeGreaterThan(0);
    });
  });
});
