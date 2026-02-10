import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildContext,
  buildGlobalLayer,
  collectAncestors,
  resolveEffectiveTags,
} from '../../../src/core/context-builder.js';
import { formatContextMarkdown } from '../../../src/formatters/markdown.js';
import { formatContextJson } from '../../../src/formatters/json.js';
import { loadGraph } from '../../../src/core/graph-loader.js';
import type { Graph, GraphNode, YggConfig } from '../../../src/model/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PROJECT = path.join(__dirname, '../../fixtures/sample-project');

describe('context-builder', () => {
  describe('buildGlobalLayer', () => {
    it('produces correct markdown from config', () => {
      const config: YggConfig = {
        name: 'Test Project',
        stack: { language: 'TypeScript', runtime: 'Node 22' },
        standards: { coding: 'ESLint', testing: 'Jest' },
        tags: {},
      };
      const layer = buildGlobalLayer(config);

      expect(layer.type).toBe('global');
      expect(layer.label).toBe('Global Context');
      expect(layer.content).toContain('**Project:** Test Project');
      expect(layer.content).toContain('**Stack:**');
      expect(layer.content).toContain('- language: TypeScript');
      expect(layer.content).toContain('- runtime: Node 22');
      expect(layer.content).toContain('**Standards:**');
      expect(layer.content).toContain('ESLint');
      expect(layer.content).toContain('Jest');
    });
  });

  describe('collectAncestors', () => {
    it('returns ancestors in root-to-parent order', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const orderService = graph.nodes.get('orders/order-service')!;
      const ancestors = collectAncestors(orderService);

      expect(ancestors).toHaveLength(1);
      expect(ancestors[0].path).toBe('orders');
    });

    it('returns empty array for top-level node', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const orders = graph.nodes.get('orders')!;
      const ancestors = collectAncestors(orders);

      expect(ancestors).toHaveLength(0);
    });

    it('returns root-to-parent order for deeper hierarchy', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const authApi = graph.nodes.get('auth/auth-api')!;
      const ancestors = collectAncestors(authApi);

      expect(ancestors).toHaveLength(1);
      expect(ancestors[0].path).toBe('auth');
    });
  });

  describe('resolveEffectiveTags', () => {
    it('includes own tags + propagated parent tags', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      // order-service's parent (orders) has requires-audit with propagates: true
      const orderService = graph.nodes.get('orders/order-service')!;
      const tags = resolveEffectiveTags(orderService, graph.config);

      expect(tags).toContain('requires-audit');
    });

    it('does NOT include non-propagating parent tags', async () => {
      // Create mock: parent has requires-auth (propagates: false), child has no tags
      const parent: GraphNode = {
        path: 'parent',
        meta: { name: 'Parent', type: 'module', tags: ['requires-auth'] },
        artifacts: [],
        children: [],
        parent: null,
      };
      const child: GraphNode = {
        path: 'parent/child',
        meta: { name: 'Child', type: 'service' },
        artifacts: [],
        children: [],
        parent,
      };
      const config: YggConfig = {
        name: 'Test',
        stack: {},
        standards: {},
        tags: {
          'requires-auth': {
            description: 'Requires auth',
            propagates: false,
          },
        },
      };

      const tags = resolveEffectiveTags(child, config);

      expect(tags).not.toContain('requires-auth');
    });

    it('includes own tags', () => {
      const node: GraphNode = {
        path: 'test',
        meta: { name: 'Test', type: 'service', tags: ['own-tag'] },
        artifacts: [],
        children: [],
        parent: null,
      };
      const config: YggConfig = {
        name: 'Test',
        stack: {},
        standards: {},
        tags: {},
      };

      const tags = resolveEffectiveTags(node, config);

      expect(tags).toContain('own-tag');
    });

    it('propagates tags through 3+ levels of hierarchy', () => {
      const grandparent: GraphNode = {
        path: 'gp',
        meta: { name: 'GP', type: 'module', tags: ['inherited-tag'] },
        artifacts: [],
        children: [],
        parent: null,
      };
      const parent: GraphNode = {
        path: 'gp/parent',
        meta: { name: 'Parent', type: 'module' }, // no own tags
        artifacts: [],
        children: [],
        parent: grandparent,
      };
      const child: GraphNode = {
        path: 'gp/parent/child',
        meta: { name: 'Child', type: 'service' }, // no own tags
        artifacts: [],
        children: [],
        parent,
      };
      const config: YggConfig = {
        name: 'Test',
        stack: {},
        standards: {},
        tags: {
          'inherited-tag': { description: 'Inherits', propagates: true },
        },
      };

      const tags = resolveEffectiveTags(child, config);
      expect(tags).toContain('inherited-tag');
    });

    it('does not duplicate tags when own tag matches propagated tag', () => {
      const parent: GraphNode = {
        path: 'parent',
        meta: { name: 'Parent', type: 'module', tags: ['shared-tag'] },
        artifacts: [],
        children: [],
        parent: null,
      };
      const child: GraphNode = {
        path: 'parent/child',
        meta: { name: 'Child', type: 'service', tags: ['shared-tag'] },
        artifacts: [],
        children: [],
        parent,
      };
      const config: YggConfig = {
        name: 'Test',
        stack: {},
        standards: {},
        tags: {
          'shared-tag': { description: 'Shared', propagates: true },
        },
      };

      const tags = resolveEffectiveTags(child, config);
      // Should contain the tag exactly once (Set deduplication)
      expect(tags.filter((t) => t === 'shared-tag')).toHaveLength(1);
    });
  });

  describe('buildContext', () => {
    it('assembles all 6 layers for fixture order-service', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const pkg = await buildContext(graph, 'orders/order-service');

      expect(pkg.nodePath).toBe('orders/order-service');
      expect(pkg.nodeName).toBe('OrderService');

      const layerTypes = pkg.layers.map((l) => l.type);
      expect(layerTypes).toContain('global');
      expect(layerTypes).toContain('hierarchy');
      expect(layerTypes).toContain('own');
      expect(layerTypes).toContain('relational');
      expect(layerTypes).toContain('aspects');
      expect(layerTypes).toContain('flows');

      expect(pkg.tokenCount).toBeGreaterThan(0);
    });

    it('throws Node not found for missing node', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);

      await expect(buildContext(graph, 'nonexistent/node')).rejects.toThrow(
        'Node not found: nonexistent/node',
      );
    });

    it('throws Broken relation when relation target not found', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      // Create a node with broken relation by mutating the graph
      const orderService = graph.nodes.get('orders/order-service')!;
      orderService.meta.relations = [
        ...(orderService.meta.relations ?? []),
        { target: 'nonexistent/target', type: 'uses' },
      ];

      await expect(buildContext(graph, 'orders/order-service')).rejects.toThrow('Broken relation');
    });

    it('computes and returns token count', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const pkg = await buildContext(graph, 'orders/order-service');

      expect(typeof pkg.tokenCount).toBe('number');
      expect(pkg.tokenCount).toBeGreaterThan(100);
    });

    it('does NOT follow transitive relations', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      // order-service -> auth/auth-api, but auth/auth-api has no relations
      // login-service -> users/user-repo: this is NOT a relation of order-service
      const pkg = await buildContext(graph, 'orders/order-service');

      const relationalLabels = pkg.layers
        .filter((l) => l.type === 'relational')
        .map((l) => l.label);

      // order-service relates to auth/auth-api only
      expect(relationalLabels.some((l) => l.includes('auth/auth-api'))).toBe(true);
      // users/user-repo is NOT a direct relation of order-service
      expect(relationalLabels.some((l) => l.includes('users/user-repo'))).toBe(false);
    });

    it('builds context for root-level node (no hierarchy layers)', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const pkg = await buildContext(graph, 'auth');

      expect(pkg.nodePath).toBe('auth');
      const hierarchyLayers = pkg.layers.filter((l) => l.type === 'hierarchy');
      expect(hierarchyLayers).toHaveLength(0);
    });

    it('node without relations has no relational layers', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      // 'users' module has no relations defined
      const pkg = await buildContext(graph, 'users');

      const relationalLayers = pkg.layers.filter((l) => l.type === 'relational');
      expect(relationalLayers).toHaveLength(0);
    });

    it('node without matching aspects has no aspect layers', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      // users module has no tags matching the audit aspect
      const pkg = await buildContext(graph, 'users');

      const aspectLayers = pkg.layers.filter((l) => l.type === 'aspects');
      expect(aspectLayers).toHaveLength(0);
    });

    it('node not in any flow has no flow layers', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      // auth/login-service is not in checkout flow
      const pkg = await buildContext(graph, 'auth/login-service');

      const flowLayers = pkg.layers.filter((l) => l.type === 'flows');
      expect(flowLayers).toHaveLength(0);
    });

    it('returns mapping paths when node has mapping', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const pkg = await buildContext(graph, 'orders/order-service');

      expect(pkg.mapping).toEqual(['src/orders/order.service.ts']);
    });

    it('returns null mapping for node without mapping', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const pkg = await buildContext(graph, 'auth');

      expect(pkg.mapping).toBeNull();
    });

    it('includes multiple aspects when node matches multiple tags', async () => {
      // Manually build a graph with 2 aspects on 2 different tags
      const parent: GraphNode = {
        path: 'mod',
        meta: { name: 'Mod', type: 'module', tags: ['tag-a'] },
        artifacts: [],
        children: [],
        parent: null,
      };
      const child: GraphNode = {
        path: 'mod/svc',
        meta: { name: 'Svc', type: 'service', tags: ['tag-b'] },
        artifacts: [{ filename: 'desc.md', content: 'service desc' }],
        children: [],
        parent,
      };
      parent.children.push(child);

      const graph: Graph = {
        config: {
          name: 'MultiAspect',
          stack: {},
          standards: {},
          tags: {
            'tag-a': { description: 'A', propagates: true },
            'tag-b': { description: 'B', propagates: false },
          },
        },
        nodes: new Map([
          ['mod', parent],
          ['mod/svc', child],
        ]),
        aspects: [
          { name: 'Aspect A', tag: 'tag-a', description: 'Desc A', rawContent: 'aspect-a-content' },
          { name: 'Aspect B', tag: 'tag-b', description: 'Desc B', rawContent: 'aspect-b-content' },
        ],
        flows: [],
        rootPath: '/tmp/ygg',
      };

      const pkg = await buildContext(graph, 'mod/svc');
      const aspectLayers = pkg.layers.filter((l) => l.type === 'aspects');
      // svc has tag-b (own) and tag-a (propagated from parent)
      expect(aspectLayers).toHaveLength(2);
      const aspectLabels = aspectLayers.map((l) => l.label);
      expect(aspectLabels).toContain('Aspect A (tag: tag-a)');
      expect(aspectLabels).toContain('Aspect B (tag: tag-b)');
    });

    it('empty own artifacts produce own layer with empty content', async () => {
      // Node with only node.yaml, no other artifacts
      const node: GraphNode = {
        path: 'bare',
        meta: { name: 'Bare', type: 'module' },
        artifacts: [], // no artifacts
        children: [],
        parent: null,
      };
      const graph: Graph = {
        config: { name: 'T', stack: {}, standards: {}, tags: {} },
        nodes: new Map([['bare', node]]),
        aspects: [],
        flows: [],
        rootPath: '/tmp/ygg',
      };

      const pkg = await buildContext(graph, 'bare');
      const ownLayer = pkg.layers.find((l) => l.type === 'own');
      expect(ownLayer).toBeDefined();
      expect(ownLayer?.content).toBe(''); // empty, but layer still exists
    });
  });

  describe('formatContextMarkdown', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-10T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('produces correct markdown structure (snapshot)', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const pkg = await buildContext(graph, 'orders/order-service');
      const output = formatContextMarkdown(pkg);

      expect(output).toMatchSnapshot();
    });

    it('contains required header fields', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const pkg = await buildContext(graph, 'orders/order-service');
      const output = formatContextMarkdown(pkg);

      expect(output).toContain('# Context Package: OrderService');
      expect(output).toContain('# Path: orders/order-service');
      expect(output).toContain('# Generated:');
    });

    it('contains Materialization Target section when mapping exists', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const pkg = await buildContext(graph, 'orders/order-service');
      const output = formatContextMarkdown(pkg);

      expect(output).toContain('## Materialization Target');
      expect(output).toContain('src/orders/order.service.ts');
    });

    it('omits Materialization Target when no mapping', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const pkg = await buildContext(graph, 'auth');
      const output = formatContextMarkdown(pkg);

      expect(output).not.toContain('## Materialization Target');
    });

    it('footer contains token count and layer types', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const pkg = await buildContext(graph, 'orders/order-service');
      const output = formatContextMarkdown(pkg);

      expect(output).toContain('Context size:');
      expect(output).toContain('tokens');
      expect(output).toContain('Layers:');
      expect(output).toContain('global');
      expect(output).toContain('own');
    });
  });

  describe('formatContextJson', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-10T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('produces correct JSON structure (snapshot)', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const pkg = await buildContext(graph, 'orders/order-service');
      const output = formatContextJson(pkg);

      expect(output).toMatchSnapshot();
    });

    it('contains all required JSON fields', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const pkg = await buildContext(graph, 'orders/order-service');
      const output = formatContextJson(pkg);
      const parsed = JSON.parse(output);

      expect(parsed).toHaveProperty('nodePath', 'orders/order-service');
      expect(parsed).toHaveProperty('nodeName', 'OrderService');
      expect(parsed).toHaveProperty('generatedAt');
      expect(parsed).toHaveProperty('layers');
      expect(parsed).toHaveProperty('mapping');
      expect(parsed).toHaveProperty('tokenCount');
    });

    it('layers array contains typed objects', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const pkg = await buildContext(graph, 'orders/order-service');
      const output = formatContextJson(pkg);
      const parsed = JSON.parse(output);

      for (const layer of parsed.layers) {
        expect(layer).toHaveProperty('type');
        expect(layer).toHaveProperty('label');
        expect(layer).toHaveProperty('content');
        expect(typeof layer.type).toBe('string');
        expect(typeof layer.label).toBe('string');
        expect(typeof layer.content).toBe('string');
      }
    });

    it('returns null mapping for node without mapping', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const pkg = await buildContext(graph, 'auth');
      const output = formatContextJson(pkg);
      const parsed = JSON.parse(output);

      expect(parsed.mapping).toBeNull();
    });
  });
});

describe('build-context CLI exit codes', () => {
  const BROKEN_RELATION_FIXTURE = path.join(
    __dirname,
    '../../fixtures/sample-project-broken-relation',
  );

  it('exit code 1 for missing node', async () => {
    const { spawnSync } = await import('node:child_process');
    const distBin = path.join(__dirname, '../../../dist/bin.js');
    const result = spawnSync('node', [distBin, 'build-context', 'nonexistent/node'], {
      cwd: FIXTURE_PROJECT,
      encoding: 'utf-8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Node not found');
  });

  it('exit code 2 for broken relation', async () => {
    const { spawnSync } = await import('node:child_process');
    const distBin = path.join(__dirname, '../../../dist/bin.js');
    const result = spawnSync('node', [distBin, 'build-context', 'orders/broken-service'], {
      cwd: BROKEN_RELATION_FIXTURE,
      encoding: 'utf-8',
    });

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('Broken relation');
  });
});
