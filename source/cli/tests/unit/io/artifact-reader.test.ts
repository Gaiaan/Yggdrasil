import { describe, it, expect } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readArtifacts } from '../../../src/io/artifact-reader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('artifact-reader', () => {
  it('reads all .md files from a directory', async () => {
    const dir = path.join(__dirname, '../../fixtures/sample-project/.yggdrasil/auth');
    const artifacts = await readArtifacts(dir);

    expect(artifacts).toHaveLength(1);
    expect(artifacts[0].filename).toBe('overview.md');
    expect(artifacts[0].content).toContain('authentication');
  });

  it('excludes node.yaml by default', async () => {
    const dir = path.join(__dirname, '../../fixtures/sample-project/.yggdrasil/auth');
    const artifacts = await readArtifacts(dir);

    expect(artifacts.every((a) => a.filename !== 'node.yaml')).toBe(true);
  });

  it('excludes specified files when passed', async () => {
    const dir = path.join(
      __dirname,
      '../../fixtures/sample-project/.yggdrasil/flows/checkout-flow',
    );
    const artifacts = await readArtifacts(dir, ['flow.yaml']);

    expect(artifacts.every((a) => a.filename !== 'flow.yaml')).toBe(true);
    expect(artifacts.some((a) => a.filename === 'sequence.md')).toBe(true);
  });

  it('excludes binary files', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-artifacts');
    await mkdir(tmpDir, { recursive: true });

    await writeFile(path.join(tmpDir, 'readme.md'), '# Readme', 'utf-8');
    await writeFile(path.join(tmpDir, 'image.png'), 'fake-png-binary', 'utf-8');
    await writeFile(path.join(tmpDir, 'photo.jpg'), 'fake-jpg', 'utf-8');
    await writeFile(path.join(tmpDir, 'doc.pdf'), 'fake-pdf', 'utf-8');

    const artifacts = await readArtifacts(tmpDir, []);

    expect(artifacts).toHaveLength(1);
    expect(artifacts[0].filename).toBe('readme.md');

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('returns artifacts sorted by filename', async () => {
    const dir = path.join(__dirname, '../../fixtures/sample-project/.yggdrasil/orders');
    const artifacts = await readArtifacts(dir);

    const filenames = artifacts.map((a) => a.filename);
    const sorted = [...filenames].sort((a, b) => a.localeCompare(b));
    expect(filenames).toEqual(sorted);
  });

  it('reads yaml artifacts from node directory', async () => {
    const dir = path.join(__dirname, '../../fixtures/sample-project/.yggdrasil/auth/auth-api');
    const artifacts = await readArtifacts(dir);

    expect(artifacts).toHaveLength(1);
    expect(artifacts[0].filename).toBe('openapi.yaml');
    expect(artifacts[0].content).toContain('openapi');
  });
});
