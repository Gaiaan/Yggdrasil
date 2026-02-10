import { describe, it, expect } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseNodeYaml } from '../../../src/io/node-parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(__dirname, '../../fixtures/sample-project/.yggdrasil');

describe('node-parser', () => {
  it('parses valid node.yaml correctly', async () => {
    const meta = await parseNodeYaml(path.join(FIXTURE_DIR, 'auth/login-service/node.yaml'));

    expect(meta.name).toBe('LoginService');
    expect(meta.type).toBe('service');
    expect(meta.relations).toEqual([{ target: 'users/user-repo', type: 'uses' }]);
    expect(meta.blackbox).toBe(false);
  });

  it('throws when name is missing', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-node');
    await mkdir(tmpDir, { recursive: true });
    const badPath = path.join(tmpDir, 'node.yaml');
    await writeFile(
      badPath,
      `
type: service
`,
      'utf-8',
    );

    await expect(parseNodeYaml(badPath)).rejects.toThrow("missing 'name'");

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('throws when type is missing', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-node');
    await mkdir(tmpDir, { recursive: true });
    const badPath = path.join(tmpDir, 'node.yaml');
    await writeFile(
      badPath,
      `
name: TestNode
`,
      'utf-8',
    );

    await expect(parseNodeYaml(badPath)).rejects.toThrow("missing 'type'");

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('handles mapping.path as string', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-node');
    await mkdir(tmpDir, { recursive: true });
    const nodePath = path.join(tmpDir, 'node.yaml');
    await writeFile(
      nodePath,
      `
name: TestNode
type: service
mapping:
  path: src/modules/test/service.ts
`,
      'utf-8',
    );

    const meta = await parseNodeYaml(nodePath);
    expect(meta.mapping?.path).toBe('src/modules/test/service.ts');

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('handles mapping.path as array', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-node');
    await mkdir(tmpDir, { recursive: true });
    const nodePath = path.join(tmpDir, 'node.yaml');
    await writeFile(
      nodePath,
      `
name: TestNode
type: component
mapping:
  path:
    - app/page.tsx
    - app/loading.tsx
`,
      'utf-8',
    );

    const meta = await parseNodeYaml(nodePath);
    expect(meta.mapping?.path).toEqual(['app/page.tsx', 'app/loading.tsx']);

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('defaults blackbox to false', async () => {
    const meta = await parseNodeYaml(path.join(FIXTURE_DIR, 'auth/login-service/node.yaml'));
    expect(meta.blackbox).toBe(false);
  });

  it('defaults missing optional fields correctly', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-node');
    await mkdir(tmpDir, { recursive: true });
    const nodePath = path.join(tmpDir, 'node.yaml');
    await writeFile(
      nodePath,
      `
name: MinimalNode
type: module
`,
      'utf-8',
    );

    const meta = await parseNodeYaml(nodePath);
    expect(meta.tags).toBeUndefined();
    expect(meta.relations).toBeUndefined();
    expect(meta.mapping).toBeUndefined();
    expect(meta.blackbox).toBe(false);

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('parses blackbox: true correctly', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-node-bb');
    await mkdir(tmpDir, { recursive: true });
    const nodePath = path.join(tmpDir, 'node.yaml');
    await writeFile(
      nodePath,
      `
name: ExternalService
type: interface
blackbox: true
`,
      'utf-8',
    );

    const meta = await parseNodeYaml(nodePath);
    expect(meta.blackbox).toBe(true);
    expect(meta.name).toBe('ExternalService');
    expect(meta.type).toBe('interface');

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('parses node with tags correctly', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-node-tags');
    await mkdir(tmpDir, { recursive: true });
    const nodePath = path.join(tmpDir, 'node.yaml');
    await writeFile(
      nodePath,
      `
name: TaggedNode
type: service
tags:
  - requires-auth
  - public-api
`,
      'utf-8',
    );

    const meta = await parseNodeYaml(nodePath);
    expect(meta.tags).toEqual(['requires-auth', 'public-api']);

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('handles mapping with no path key (defaults to empty string)', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-node-no-path');
    await mkdir(tmpDir, { recursive: true });
    const nodePath = path.join(tmpDir, 'node.yaml');
    await writeFile(
      nodePath,
      `
name: NoPathNode
type: service
mapping: {}
`,
      'utf-8',
    );

    const meta = await parseNodeYaml(nodePath);
    expect(meta.mapping).toBeDefined();
    expect(meta.mapping?.path).toBe('');

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('parses node with relations correctly', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-node-rels');
    await mkdir(tmpDir, { recursive: true });
    const nodePath = path.join(tmpDir, 'node.yaml');
    await writeFile(
      nodePath,
      `
name: RelatedNode
type: service
relations:
  - target: auth/auth-api
    type: uses
  - target: users/user-repo
    type: depends-on
`,
      'utf-8',
    );

    const meta = await parseNodeYaml(nodePath);
    expect(meta.relations).toHaveLength(2);
    expect(meta.relations![0]).toEqual({
      target: 'auth/auth-api',
      type: 'uses',
    });
    expect(meta.relations![1]).toEqual({
      target: 'users/user-repo',
      type: 'depends-on',
    });

    await rm(tmpDir, { recursive: true, force: true });
  });
});
