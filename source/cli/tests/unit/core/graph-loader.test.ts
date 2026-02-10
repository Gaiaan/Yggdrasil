import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGraph } from '../../../src/core/graph-loader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PROJECT = path.join(__dirname, '../../fixtures/sample-project');

describe('graph-loader', () => {
  it('loads graph with correct number of nodes', async () => {
    const graph = await loadGraph(FIXTURE_PROJECT);

    // Top-level: auth, orders, users
    // auth children: login-service, auth-api
    // orders children: order-service
    // users children: user-repo, missing-service
    // Total: 8 nodes
    expect(graph.nodes.size).toBe(8);

    expect(graph.nodes.has('auth')).toBe(true);
    expect(graph.nodes.has('auth/login-service')).toBe(true);
    expect(graph.nodes.has('auth/auth-api')).toBe(true);
    expect(graph.nodes.has('orders')).toBe(true);
    expect(graph.nodes.has('orders/order-service')).toBe(true);
    expect(graph.nodes.has('users')).toBe(true);
    expect(graph.nodes.has('users/user-repo')).toBe(true);
    expect(graph.nodes.has('users/missing-service')).toBe(true);
  });

  it('loads aspects correctly', async () => {
    const graph = await loadGraph(FIXTURE_PROJECT);

    expect(graph.aspects).toHaveLength(1);
    expect(graph.aspects[0].name).toBe('Audit Logging');
    expect(graph.aspects[0].tag).toBe('requires-audit');
  });

  it('loads flows correctly', async () => {
    const graph = await loadGraph(FIXTURE_PROJECT);

    expect(graph.flows).toHaveLength(1);
    expect(graph.flows[0].name).toBe('Checkout Flow');
    expect(graph.flows[0].nodes).toContain('auth/auth-api');
    expect(graph.flows[0].nodes).toContain('orders/order-service');
    expect(graph.flows[0].nodes).toContain('users/user-repo');
    expect(graph.flows[0].dirPath).toBe('flows/checkout-flow');
  });

  it('loads flow artifacts', async () => {
    const graph = await loadGraph(FIXTURE_PROJECT);

    const flow = graph.flows[0];
    expect(flow.artifacts).toHaveLength(1);
    expect(flow.artifacts[0].filename).toBe('sequence.md');
    expect(flow.artifacts[0].content).toContain('sequenceDiagram');
  });

  it('top-level nodes have parent = null', async () => {
    const graph = await loadGraph(FIXTURE_PROJECT);

    expect(graph.nodes.get('auth')?.parent).toBeNull();
    expect(graph.nodes.get('orders')?.parent).toBeNull();
    expect(graph.nodes.get('users')?.parent).toBeNull();
  });

  it('child nodes have correct parent reference', async () => {
    const graph = await loadGraph(FIXTURE_PROJECT);

    const loginService = graph.nodes.get('auth/login-service');
    expect(loginService?.parent).toBe(graph.nodes.get('auth'));

    const orderService = graph.nodes.get('orders/order-service');
    expect(orderService?.parent).toBe(graph.nodes.get('orders'));

    const userRepo = graph.nodes.get('users/user-repo');
    expect(userRepo?.parent).toBe(graph.nodes.get('users'));

    const missingService = graph.nodes.get('users/missing-service');
    expect(missingService?.parent).toBe(graph.nodes.get('users'));
  });

  it('parent-child relationships are bidirectional', async () => {
    const graph = await loadGraph(FIXTURE_PROJECT);

    const auth = graph.nodes.get('auth');
    expect(auth?.children).toHaveLength(2);
    expect(auth?.children.map((c) => c.path).sort()).toEqual([
      'auth/auth-api',
      'auth/login-service',
    ]);

    const users = graph.nodes.get('users');
    expect(users?.children).toHaveLength(2);
    expect(users?.children.map((c) => c.path).sort()).toEqual([
      'users/missing-service',
      'users/user-repo',
    ]);
  });

  it('node artifacts are correct', async () => {
    const graph = await loadGraph(FIXTURE_PROJECT);

    const orderService = graph.nodes.get('orders/order-service');
    expect(orderService?.artifacts).toHaveLength(2);
    const artifactNames = orderService!.artifacts.map((a) => a.filename).sort();
    expect(artifactNames).toEqual(['description.md', 'state-machine.md']);
  });

  it('loads config correctly', async () => {
    const graph = await loadGraph(FIXTURE_PROJECT);

    expect(graph.config.name).toBe('Sample E-Commerce System');
    expect(graph.config.tags).toHaveProperty('requires-auth');
    expect(graph.rootPath).toContain('.yggdrasil');
  });

  it('throws when .yggdrasil directory does not exist', async () => {
    await expect(loadGraph('/nonexistent/project/path')).rejects.toThrow(
      'No .yggdrasil/ directory found',
    );
  });

  it('loads node with blackbox flag', async () => {
    // Create a temporary fixture with a blackbox node
    const { writeFile, mkdir, rm } = await import('node:fs/promises');
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-blackbox');
    const yggRoot = path.join(tmpDir, '.yggdrasil');
    const bbNodeDir = path.join(yggRoot, 'external');

    await mkdir(bbNodeDir, { recursive: true });
    await writeFile(
      path.join(yggRoot, 'config.yaml'),
      'name: BlackboxTest\nstack: {}\nstandards: {}\ntags: {}',
    );
    await writeFile(
      path.join(bbNodeDir, 'node.yaml'),
      'name: ExternalAPI\ntype: interface\nblackbox: true\n',
    );

    try {
      const graph = await loadGraph(tmpDir);
      const bbNode = graph.nodes.get('external');
      expect(bbNode).toBeDefined();
      expect(bbNode?.meta.blackbox).toBe(true);
      expect(bbNode?.meta.name).toBe('ExternalAPI');
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('handles 3+ levels of nesting', async () => {
    const { writeFile, mkdir, rm } = await import('node:fs/promises');
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-deep');
    const yggRoot = path.join(tmpDir, '.yggdrasil');
    const lvl1 = path.join(yggRoot, 'level1');
    const lvl2 = path.join(lvl1, 'level2');
    const lvl3 = path.join(lvl2, 'level3');

    await mkdir(lvl3, { recursive: true });
    await writeFile(
      path.join(yggRoot, 'config.yaml'),
      'name: DeepTest\nstack: {}\nstandards: {}\ntags: {}',
    );
    await writeFile(path.join(lvl1, 'node.yaml'), 'name: L1\ntype: module\n');
    await writeFile(path.join(lvl2, 'node.yaml'), 'name: L2\ntype: module\n');
    await writeFile(path.join(lvl3, 'node.yaml'), 'name: L3\ntype: service\n');

    try {
      const graph = await loadGraph(tmpDir);
      expect(graph.nodes.size).toBe(3);
      expect(graph.nodes.has('level1')).toBe(true);
      expect(graph.nodes.has('level1/level2')).toBe(true);
      expect(graph.nodes.has('level1/level2/level3')).toBe(true);

      const l3 = graph.nodes.get('level1/level2/level3')!;
      expect(l3.parent?.path).toBe('level1/level2');
      expect(l3.parent?.parent?.path).toBe('level1');
      expect(l3.parent?.parent?.parent).toBeNull();
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('loads node with tags and relations correctly', async () => {
    const graph = await loadGraph(FIXTURE_PROJECT);
    const orderService = graph.nodes.get('orders/order-service');

    expect(orderService?.meta.relations).toBeDefined();
    expect(orderService?.meta.relations).toHaveLength(1);
    expect(orderService?.meta.relations![0].target).toBe('auth/auth-api');
    expect(orderService?.meta.relations![0].type).toBe('uses');
  });

  it('skips reserved directories (aspects, flows, .briefs)', async () => {
    const graph = await loadGraph(FIXTURE_PROJECT);
    // aspects/ and flows/ should not appear as nodes
    expect(graph.nodes.has('aspects')).toBe(false);
    expect(graph.nodes.has('flows')).toBe(false);
  });

  it('handles flow directory without flow.yaml gracefully', async () => {
    const { writeFile, mkdir, rm } = await import('node:fs/promises');
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-empty-flow');
    const yggRoot = path.join(tmpDir, '.yggdrasil');
    const flowsDir = path.join(yggRoot, 'flows', 'orphan-flow');
    const nodeDir = path.join(yggRoot, 'test-node');

    await mkdir(flowsDir, { recursive: true });
    await mkdir(nodeDir, { recursive: true });
    await writeFile(
      path.join(yggRoot, 'config.yaml'),
      'name: FlowTest\nstack: {}\nstandards: {}\ntags: {}',
    );
    await writeFile(path.join(nodeDir, 'node.yaml'), 'name: TestNode\ntype: service\n');
    // Create a file in the flow dir but NOT flow.yaml
    await writeFile(path.join(flowsDir, 'notes.md'), '# Some notes');

    try {
      const graph = await loadGraph(tmpDir);
      // Should load fine, just no flows
      expect(graph.flows).toHaveLength(0);
      expect(graph.nodes.size).toBe(1);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('handles project without aspects/ directory', async () => {
    const { writeFile, mkdir, rm } = await import('node:fs/promises');
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-no-aspects');
    const yggRoot = path.join(tmpDir, '.yggdrasil');
    const nodeDir = path.join(yggRoot, 'test-node');

    await mkdir(nodeDir, { recursive: true });
    await writeFile(
      path.join(yggRoot, 'config.yaml'),
      'name: NoAspects\nstack: {}\nstandards: {}\ntags: {}',
    );
    await writeFile(path.join(nodeDir, 'node.yaml'), 'name: TestNode\ntype: service\n');

    try {
      const graph = await loadGraph(tmpDir);
      expect(graph.aspects).toHaveLength(0);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('skips hidden directories (dot-prefixed) within node dirs', async () => {
    const { writeFile, mkdir, rm } = await import('node:fs/promises');
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-hidden-dir');
    const yggRoot = path.join(tmpDir, '.yggdrasil');
    const nodeDir = path.join(yggRoot, 'mymodule');
    const hiddenDir = path.join(nodeDir, '.internal');

    await mkdir(hiddenDir, { recursive: true });
    await writeFile(
      path.join(yggRoot, 'config.yaml'),
      'name: HiddenTest\nstack: {}\nstandards: {}\ntags: {}',
    );
    await writeFile(path.join(nodeDir, 'node.yaml'), 'name: MyModule\ntype: module\n');
    // Hidden dir has a node.yaml — should NOT be loaded
    await writeFile(path.join(hiddenDir, 'node.yaml'), 'name: Hidden\ntype: service\n');

    try {
      const graph = await loadGraph(tmpDir);
      expect(graph.nodes.size).toBe(1);
      expect(graph.nodes.has('mymodule')).toBe(true);
      expect(graph.nodes.has('mymodule/.internal')).toBe(false);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('skips .briefs/ reserved directory within node', async () => {
    const { writeFile, mkdir, rm } = await import('node:fs/promises');
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-briefs');
    const yggRoot = path.join(tmpDir, '.yggdrasil');
    const nodeDir = path.join(yggRoot, 'svc');
    const briefsDir = path.join(nodeDir, '.briefs');

    await mkdir(briefsDir, { recursive: true });
    await writeFile(
      path.join(yggRoot, 'config.yaml'),
      'name: BriefsTest\nstack: {}\nstandards: {}\ntags: {}',
    );
    await writeFile(path.join(nodeDir, 'node.yaml'), 'name: Svc\ntype: service\n');
    await writeFile(path.join(briefsDir, 'node.yaml'), 'name: Brief\ntype: module\n');

    try {
      const graph = await loadGraph(tmpDir);
      expect(graph.nodes.size).toBe(1);
      expect(graph.nodes.has('svc/.briefs')).toBe(false);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('ignores non-yaml files in aspects/ directory', async () => {
    const { writeFile, mkdir, rm } = await import('node:fs/promises');
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-aspects-noise');
    const yggRoot = path.join(tmpDir, '.yggdrasil');
    const aspectsDir = path.join(yggRoot, 'aspects');
    const nodeDir = path.join(yggRoot, 'svc');

    await mkdir(aspectsDir, { recursive: true });
    await mkdir(nodeDir, { recursive: true });
    await writeFile(
      path.join(yggRoot, 'config.yaml'),
      'name: Test\nstack: {}\nstandards: {}\ntags:\n  my-tag:\n    description: T\n    propagates: false\n',
    );
    await writeFile(path.join(nodeDir, 'node.yaml'), 'name: Svc\ntype: service\n');
    // Valid aspect yaml
    await writeFile(
      path.join(aspectsDir, 'good.yaml'),
      'name: Good\ntag: my-tag\ndescription: works\n',
    );
    // Non-yaml file — should be ignored
    await writeFile(path.join(aspectsDir, 'README.md'), '# not an aspect');
    // .yml extension — should be loaded
    await writeFile(
      path.join(aspectsDir, 'also-good.yml'),
      'name: AlsoGood\ntag: my-tag\ndescription: also works\n',
    );

    try {
      const graph = await loadGraph(tmpDir);
      expect(graph.aspects).toHaveLength(2);
      const names = graph.aspects.map((a) => a.name).sort();
      expect(names).toEqual(['AlsoGood', 'Good']);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('ignores non-directory entries in flows/ directory', async () => {
    const { writeFile, mkdir, rm } = await import('node:fs/promises');
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-flows-noise');
    const yggRoot = path.join(tmpDir, '.yggdrasil');
    const flowsDir = path.join(yggRoot, 'flows');
    const flowDir = path.join(flowsDir, 'my-flow');
    const nodeDir = path.join(yggRoot, 'svc');

    await mkdir(flowDir, { recursive: true });
    await mkdir(nodeDir, { recursive: true });
    await writeFile(
      path.join(yggRoot, 'config.yaml'),
      'name: Test\nstack: {}\nstandards: {}\ntags: {}',
    );
    await writeFile(path.join(nodeDir, 'node.yaml'), 'name: Svc\ntype: service\n');
    await writeFile(path.join(flowDir, 'flow.yaml'), 'name: MyFlow\nnodes:\n  - svc\n');
    // A loose file in flows/ (not a directory) — should be ignored
    await writeFile(path.join(flowsDir, 'notes.txt'), 'some notes');

    try {
      const graph = await loadGraph(tmpDir);
      expect(graph.flows).toHaveLength(1);
      expect(graph.flows[0].name).toBe('MyFlow');
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('node directory with only node.yaml has empty artifacts', async () => {
    const { writeFile, mkdir, rm } = await import('node:fs/promises');
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-no-artifacts');
    const yggRoot = path.join(tmpDir, '.yggdrasil');
    const nodeDir = path.join(yggRoot, 'bare');

    await mkdir(nodeDir, { recursive: true });
    await writeFile(
      path.join(yggRoot, 'config.yaml'),
      'name: Bare\nstack: {}\nstandards: {}\ntags: {}',
    );
    await writeFile(path.join(nodeDir, 'node.yaml'), 'name: Bare\ntype: module\n');

    try {
      const graph = await loadGraph(tmpDir);
      const bare = graph.nodes.get('bare');
      expect(bare).toBeDefined();
      expect(bare?.artifacts).toHaveLength(0);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});
