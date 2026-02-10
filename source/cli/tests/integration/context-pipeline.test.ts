import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGraph } from '../../src/core/graph-loader.js';
import { buildContext } from '../../src/core/context-builder.js';
import { formatContextMarkdown } from '../../src/formatters/markdown.js';
import { formatContextJson } from '../../src/formatters/json.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PROJECT = path.join(__dirname, '../fixtures/sample-project');

describe('context-pipeline', () => {
  it('full pipeline: loadGraph → buildContext → formatMarkdown', async () => {
    const graph = await loadGraph(FIXTURE_PROJECT);
    const pkg = await buildContext(graph, 'orders/order-service');
    const output = formatContextMarkdown(pkg);

    expect(output).toContain('Context Package: OrderService');
    expect(output).toContain('Path: orders/order-service');
    expect(output).toContain('Global Context');
    expect(output).toContain('Node: OrderService');
    expect(output).toContain('Module Context');
    expect(output).toContain('relational');
    expect(output).toContain('Audit Logging');
    expect(output).toContain('Checkout Flow');
    expect(output).toContain('Materialization Target');
    expect(output).toContain('src/orders/order.service.ts');
  });

  it('global context has stack info', async () => {
    const graph = await loadGraph(FIXTURE_PROJECT);
    const pkg = await buildContext(graph, 'orders/order-service');

    const globalLayer = pkg.layers.find((l) => l.type === 'global');
    expect(globalLayer).toBeDefined();
    expect(globalLayer?.content).toContain('TypeScript');
    expect(globalLayer?.content).toContain('NestJS');
    expect(globalLayer?.content).toContain('PostgreSQL');
  });

  it('hierarchy includes orders/ artifacts', async () => {
    const graph = await loadGraph(FIXTURE_PROJECT);
    const pkg = await buildContext(graph, 'orders/order-service');

    const hierarchyLayer = pkg.layers.find((l) => l.type === 'hierarchy');
    expect(hierarchyLayer).toBeDefined();
    expect(hierarchyLayer?.label).toContain('orders');
    expect(hierarchyLayer?.content).toContain('business-rules');
    expect(hierarchyLayer?.content).toContain('description');
  });

  it('own artifacts present', async () => {
    const graph = await loadGraph(FIXTURE_PROJECT);
    const pkg = await buildContext(graph, 'orders/order-service');

    const ownLayer = pkg.layers.find((l) => l.type === 'own');
    expect(ownLayer).toBeDefined();
    expect(ownLayer?.label).toContain('OrderService');
    expect(ownLayer?.content).toContain('description');
    expect(ownLayer?.content).toContain('state-machine');
  });

  it('relational includes auth-api artifacts', async () => {
    const graph = await loadGraph(FIXTURE_PROJECT);
    const pkg = await buildContext(graph, 'orders/order-service');

    const relationalLayers = pkg.layers.filter((l) => l.type === 'relational');
    expect(relationalLayers.length).toBeGreaterThan(0);
    const authApiLayer = relationalLayers.find((l) => l.label.includes('auth/auth-api'));
    expect(authApiLayer).toBeDefined();
    expect(authApiLayer?.content).toContain('openapi');
  });

  it('audit aspect included (tag propagation from parent)', async () => {
    const graph = await loadGraph(FIXTURE_PROJECT);
    const pkg = await buildContext(graph, 'orders/order-service');

    const aspectLayers = pkg.layers.filter((l) => l.type === 'aspects');
    expect(aspectLayers.length).toBeGreaterThan(0);
    const auditLayer = aspectLayers.find((l) => l.content.includes('Audit Logging'));
    expect(auditLayer).toBeDefined();
    expect(auditLayer?.content).toContain('requires-audit');
  });

  it('checkout flow artifacts included', async () => {
    const graph = await loadGraph(FIXTURE_PROJECT);
    const pkg = await buildContext(graph, 'orders/order-service');

    const flowLayers = pkg.layers.filter((l) => l.type === 'flows');
    expect(flowLayers.length).toBeGreaterThan(0);
    const checkoutLayer = flowLayers.find((l) => l.label.includes('Checkout Flow'));
    expect(checkoutLayer).toBeDefined();
    expect(checkoutLayer?.content).toContain('sequence');
  });

  it('formatContextJson produces valid JSON', async () => {
    const graph = await loadGraph(FIXTURE_PROJECT);
    const pkg = await buildContext(graph, 'orders/order-service');
    const output = formatContextJson(pkg);

    const parsed = JSON.parse(output);
    expect(parsed.nodeName).toBe('OrderService');
    expect(parsed.nodePath).toBe('orders/order-service');
    expect(parsed.layers).toBeDefined();
    expect(parsed.layers.length).toBeGreaterThan(0);
    expect(parsed.mapping).toContain('src/orders/order.service.ts');
  });
});
