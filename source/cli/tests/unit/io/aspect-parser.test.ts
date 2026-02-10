import { describe, it, expect } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseAspect } from '../../../src/io/aspect-parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(__dirname, '../../fixtures/sample-project/.yggdrasil');

describe('aspect-parser', () => {
  it('parses valid aspect.yaml correctly', async () => {
    const aspect = await parseAspect(path.join(FIXTURE_DIR, 'aspects/audit-logging.yaml'));

    expect(aspect.name).toBe('Audit Logging');
    expect(aspect.tag).toBe('requires-audit');
    expect(aspect.description).toContain('audit_log');
    expect(aspect.requirements).toHaveLength(3);
    expect(aspect.requirements).toContain(
      'Use AuditService.log() for all create, update, and delete operations',
    );
    expect(aspect.rawContent).toContain('name: Audit Logging');
  });

  it('throws when name is missing', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-aspect');
    await mkdir(tmpDir, { recursive: true });
    const badPath = path.join(tmpDir, 'aspect.yaml');
    await writeFile(
      badPath,
      `
tag: some-tag
description: "Test"
`,
      'utf-8',
    );

    await expect(parseAspect(badPath)).rejects.toThrow("missing 'name' or 'tag'");

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('throws when tag is missing', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-aspect');
    await mkdir(tmpDir, { recursive: true });
    const badPath = path.join(tmpDir, 'aspect.yaml');
    await writeFile(
      badPath,
      `
name: Test Aspect
description: "Test"
`,
      'utf-8',
    );

    await expect(parseAspect(badPath)).rejects.toThrow("missing 'name' or 'tag'");

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('defaults optional fields when missing', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-aspect');
    await mkdir(tmpDir, { recursive: true });
    const aspectPath = path.join(tmpDir, 'aspect.yaml');
    await writeFile(
      aspectPath,
      `
name: Minimal Aspect
tag: minimal-tag
`,
      'utf-8',
    );

    const aspect = await parseAspect(aspectPath);
    expect(aspect.name).toBe('Minimal Aspect');
    expect(aspect.tag).toBe('minimal-tag');
    expect(aspect.description).toBe('');
    expect(aspect.requirements).toBeUndefined();
    expect(aspect.rawContent).toContain('name: Minimal Aspect');

    await rm(tmpDir, { recursive: true, force: true });
  });
});
