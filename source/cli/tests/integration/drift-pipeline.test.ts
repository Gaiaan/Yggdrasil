import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGraph } from '../../src/core/graph-loader.js';
import { detectDrift } from '../../src/core/drift-detector.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PROJECT = path.join(__dirname, '../fixtures/sample-project');

describe('drift-pipeline', () => {
  it('load fixture graph → detectDrift → verify correct states per node', async () => {
    const graph = await loadGraph(FIXTURE_PROJECT);
    const report = await detectDrift(graph);

    expect(report.totalChecked).toBeGreaterThan(0);
    expect(report.entries.length).toBe(report.totalChecked);

    // OK: auth/login-service has matching hash
    const okEntry = report.entries.find(
      (e) => e.nodePath === 'auth/login-service' && e.status === 'ok',
    );
    expect(okEntry).toBeDefined();

    // DRIFT: orders/order-service has different hash
    const driftEntry = report.entries.find(
      (e) => e.nodePath === 'orders/order-service' && e.status === 'drift',
    );
    expect(driftEntry).toBeDefined();
    expect(driftEntry?.details).toContain('order.service.ts');

    // MISSING: users/missing-service maps to non-existent file
    const missingEntry = report.entries.find(
      (e) => e.nodePath === 'users/missing-service' && e.status === 'missing',
    );
    expect(missingEntry).toBeDefined();
    expect(missingEntry?.details).toContain('missing.service.ts');

    // UNMATERIALIZED: auth/auth-api has no drift state
    const unmaterializedEntry = report.entries.find(
      (e) => e.nodePath === 'auth/auth-api' && e.status === 'unmaterialized',
    );
    expect(unmaterializedEntry).toBeDefined();
    expect(unmaterializedEntry?.details).toContain('No drift state recorded');

    // Counts match
    expect(report.driftCount).toBe(report.entries.filter((e) => e.status === 'drift').length);
    expect(report.missingCount).toBe(report.entries.filter((e) => e.status === 'missing').length);
  });
});
