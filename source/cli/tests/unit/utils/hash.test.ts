import { describe, it, expect } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashFile, hashString } from '../../../src/utils/hash.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('hash', () => {
  describe('hashString', () => {
    it('returns deterministic sha256 hash', () => {
      const h1 = hashString('hello');
      const h2 = hashString('hello');
      expect(h1).toBe(h2);
      expect(h1).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    it('different content produces different hash', () => {
      const h1 = hashString('hello');
      const h2 = hashString('world');
      expect(h1).not.toBe(h2);
    });
  });

  describe('hashFile', () => {
    it('returns hash of file content', async () => {
      const tmpDir = path.join(__dirname, '../../fixtures/tmp-hash');
      await mkdir(tmpDir, { recursive: true });
      const filePath = path.join(tmpDir, 'test.txt');
      await writeFile(filePath, 'test content', 'utf-8');

      const hash = await hashFile(filePath);
      const expected = hashString('test content');
      expect(hash).toBe(expected);

      await rm(tmpDir, { recursive: true, force: true });
    });
  });
});
