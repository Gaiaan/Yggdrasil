import { describe, it, expect } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFlow } from '../../../src/io/flow-parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(__dirname, '../../fixtures/sample-project/.yggdrasil');

describe('flow-parser', () => {
  it('parses valid flow with artifacts', async () => {
    const flowDir = path.join(FIXTURE_DIR, 'flows/checkout-flow');
    const flow = await parseFlow(flowDir, FIXTURE_DIR);

    expect(flow.name).toBe('Checkout Flow');
    expect(flow.nodes).toContain('auth/auth-api');
    expect(flow.nodes).toContain('orders/order-service');
    expect(flow.nodes).toContain('users/user-repo');
    expect(flow.dirPath).toBe('flows/checkout-flow');
    expect(flow.artifacts).toHaveLength(1);
    expect(flow.artifacts[0].filename).toBe('sequence.md');
    expect(flow.artifacts[0].content).toContain('sequenceDiagram');
  });

  it('throws when name is missing', async () => {
    const tmpBase = path.join(__dirname, '../../fixtures/tmp-flow-test');
    const flowDir = path.join(tmpBase, 'flows', 'bad-flow');
    await mkdir(flowDir, { recursive: true });
    await writeFile(
      path.join(flowDir, 'flow.yaml'),
      `
nodes:
  - some/node
`,
      'utf-8',
    );

    await expect(parseFlow(flowDir, tmpBase)).rejects.toThrow("missing 'name' or 'nodes'");

    await rm(tmpBase, { recursive: true, force: true });
  });

  it('throws when nodes is missing', async () => {
    const tmpBase = path.join(__dirname, '../../fixtures/tmp-flow-test');
    const flowDir = path.join(tmpBase, 'flows', 'bad-flow');
    await mkdir(flowDir, { recursive: true });
    await writeFile(
      path.join(flowDir, 'flow.yaml'),
      `
name: Test Flow
`,
      'utf-8',
    );

    await expect(parseFlow(flowDir, tmpBase)).rejects.toThrow("missing 'name' or 'nodes'");

    await rm(tmpBase, { recursive: true, force: true });
  });

  it('includes all artifact files except flow.yaml', async () => {
    const tmpBase = path.join(__dirname, '../../fixtures/tmp-flow-test');
    const yggRoot = path.join(tmpBase, '.yggdrasil');
    const flowDir = path.join(yggRoot, 'flows', 'test-flow');
    await mkdir(flowDir, { recursive: true });
    await writeFile(
      path.join(flowDir, 'flow.yaml'),
      `
name: Test Flow
nodes:
  - a/b
`,
      'utf-8',
    );
    await writeFile(path.join(flowDir, 'readme.md'), '# Flow readme', 'utf-8');
    await writeFile(path.join(flowDir, 'sequence.md'), 'A -> B', 'utf-8');

    const flow = await parseFlow(flowDir, yggRoot);

    expect(flow.artifacts).toHaveLength(2);
    const filenames = flow.artifacts.map((a) => a.filename).sort();
    expect(filenames).toEqual(['readme.md', 'sequence.md']);
    expect(flow.dirPath).toBe('flows/test-flow');

    await rm(tmpBase, { recursive: true, force: true });
  });
});
