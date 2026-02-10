import { describe, it, expect } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseConfig } from '../../../src/io/config-parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(__dirname, '../../fixtures/sample-project/.yggdrasil');

describe('config-parser', () => {
  it('parses valid config.yaml correctly', async () => {
    const config = await parseConfig(path.join(FIXTURE_DIR, 'config.yaml'));

    expect(config.name).toBe('Sample E-Commerce System');
    expect(config.stack).toEqual({
      language: 'TypeScript',
      runtime: 'Node 22',
      framework: 'NestJS',
      database: 'PostgreSQL',
    });
    expect(config.standards).toHaveProperty('coding');
    expect(config.standards).toHaveProperty('testing');
    expect(config.limits?.context_warning_tokens).toBe(8000);
    expect(config.tags).toHaveProperty('requires-auth');
    expect(config.tags).toHaveProperty('requires-audit');
    expect(config.tags).toHaveProperty('public-api');
  });

  it('throws when name is missing', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-config');
    await mkdir(tmpDir, { recursive: true });
    const badConfigPath = path.join(tmpDir, 'config.yaml');
    await writeFile(
      badConfigPath,
      `
stack: {}
standards: {}
tags: {}
`,
      'utf-8',
    );

    await expect(parseConfig(badConfigPath)).rejects.toThrow(
      "config.yaml: missing or invalid 'name' field",
    );

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('defaults empty tags to empty object', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-config');
    await mkdir(tmpDir, { recursive: true });
    const minimalConfigPath = path.join(tmpDir, 'config.yaml');
    await writeFile(
      minimalConfigPath,
      `
name: "Minimal Config"
`,
      'utf-8',
    );

    const config = await parseConfig(minimalConfigPath);
    expect(config.tags).toEqual({});

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('parses limits.context_warning_tokens when present', async () => {
    const config = await parseConfig(path.join(FIXTURE_DIR, 'config.yaml'));
    expect(config.limits?.context_warning_tokens).toBe(8000);
  });

  it('parses tags with conflicts_with correctly', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-config-conflicts');
    await mkdir(tmpDir, { recursive: true });
    const configPath = path.join(tmpDir, 'config.yaml');
    await writeFile(
      configPath,
      `
name: "Conflict Test"
stack: {}
standards: {}
tags:
  server-only:
    description: "Server side"
    propagates: false
    conflicts_with:
      - client-interactive
  client-interactive:
    description: "Client side"
    propagates: false
    conflicts_with:
      - server-only
`,
      'utf-8',
    );

    const config = await parseConfig(configPath);
    expect(config.tags['server-only'].conflicts_with).toEqual(['client-interactive']);
    expect(config.tags['client-interactive'].conflicts_with).toEqual(['server-only']);

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('parses tags with propagates: true', async () => {
    const config = await parseConfig(path.join(FIXTURE_DIR, 'config.yaml'));
    expect(config.tags['requires-audit'].propagates).toBe(true);
    expect(config.tags['requires-auth'].propagates).toBe(false);
  });

  it('defaults stack and standards to empty objects', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-config-minimal');
    await mkdir(tmpDir, { recursive: true });
    const configPath = path.join(tmpDir, 'config.yaml');
    await writeFile(configPath, 'name: "Bare Config"\n', 'utf-8');

    const config = await parseConfig(configPath);
    expect(config.stack).toEqual({});
    expect(config.standards).toEqual({});

    await rm(tmpDir, { recursive: true, force: true });
  });
});
