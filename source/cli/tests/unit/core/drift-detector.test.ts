import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { loadGraph } from '../../../src/core/graph-loader.js';
import { detectDrift, absorbDrift } from '../../../src/core/drift-detector.js';
import { readDriftState } from '../../../src/io/drift-state-store.js';
import { hashString } from '../../../src/utils/hash.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PROJECT = path.join(__dirname, '../../fixtures/sample-project');

describe('drift-detector', () => {
  describe('detectDrift', () => {
    it('reports OK when file hash matches stored hash', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const report = await detectDrift(graph);

      const okEntry = report.entries.find(
        (e) => e.nodePath === 'auth/login-service' && e.status === 'ok',
      );
      expect(okEntry).toBeDefined();
      expect(okEntry?.mappingPaths).toContain('src/auth/login.service.ts');
    });

    it('reports DRIFT when file hash differs from stored hash', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const report = await detectDrift(graph);

      const driftEntry = report.entries.find(
        (e) => e.nodePath === 'orders/order-service' && e.status === 'drift',
      );
      expect(driftEntry).toBeDefined();
      expect(driftEntry?.details).toContain('order.service.ts');
    });

    it('reports MISSING when mapped file does not exist', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const report = await detectDrift(graph);

      const missingEntry = report.entries.find(
        (e) => e.nodePath === 'users/missing-service' && e.status === 'missing',
      );
      expect(missingEntry).toBeDefined();
      expect(missingEntry?.details).toContain('missing.service.ts');
    });

    it('reports UNMATERIALIZED when no drift-state entry exists', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const report = await detectDrift(graph);

      const unmaterializedEntry = report.entries.find(
        (e) => e.nodePath === 'auth/auth-api' && e.status === 'unmaterialized',
      );
      expect(unmaterializedEntry).toBeDefined();
      expect(unmaterializedEntry?.details).toContain('No drift state recorded');
    });

    it('multi-file mapping: flags drift if any file changed', async () => {
      // Create a temporary fixture with multi-file mapping
      const tmpDir = path.join(__dirname, '../../fixtures/drift-multi-file');
      const yggRoot = path.join(tmpDir, '.yggdrasil');
      const srcDir = path.join(tmpDir, 'src');
      const nodeDir = path.join(yggRoot, 'multi/multi-service');

      await mkdir(path.join(srcDir, 'multi'), { recursive: true });
      await mkdir(nodeDir, { recursive: true });

      await writeFile(
        path.join(tmpDir, '.yggdrasil', 'config.yaml'),
        'name: Test\nstack: {}\nstandards: {}\ntags: {}',
      );
      await writeFile(path.join(yggRoot, 'multi', 'node.yaml'), 'name: Multi\ntype: module\n');
      await writeFile(
        path.join(nodeDir, 'node.yaml'),
        `name: MultiService
type: service
mapping:
  path:
    - src/multi/file-a.ts
    - src/multi/file-b.ts
`,
      );
      await writeFile(path.join(srcDir, 'multi', 'file-a.ts'), '// file-a');
      await writeFile(path.join(srcDir, 'multi', 'file-b.ts'), '// file-b');

      const hashA = hashString('// file-a');
      const hashB = hashString('// file-b');

      await writeFile(
        path.join(yggRoot, '.drift-state'),
        `entries:
  multi/multi-service:
    path:
      - src/multi/file-a.ts
      - src/multi/file-b.ts
    hash:
      src/multi/file-a.ts: ${hashA}
      src/multi/file-b.ts: ${hashB}
    materialized_at: "2026-02-10T12:00:00Z"
`,
      );

      const graph = await loadGraph(tmpDir);
      const reportBefore = await detectDrift(graph);
      const okBefore = reportBefore.entries.find((e) => e.nodePath === 'multi/multi-service');
      expect(okBefore?.status).toBe('ok');

      // Modify one file
      await writeFile(path.join(srcDir, 'multi', 'file-a.ts'), '// file-a MODIFIED');

      const reportAfter = await detectDrift(graph);
      const driftAfter = reportAfter.entries.find((e) => e.nodePath === 'multi/multi-service');
      expect(driftAfter?.status).toBe('drift');
      expect(driftAfter?.details).toContain('file-a.ts');
    });

    it('--node filter: only checks specified node', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const report = await detectDrift(graph, 'orders/order-service');

      expect(report.entries).toHaveLength(1);
      expect(report.entries[0].nodePath).toBe('orders/order-service');
    });
  });

  describe('absorbDrift', () => {
    it('updates .drift-state with current hashes', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const orderServicePath = path.join(FIXTURE_PROJECT, 'src/orders/order.service.ts');

      // Verify order-service is in drift before absorb
      const reportBefore = await detectDrift(graph);
      const driftBefore = reportBefore.entries.find((e) => e.nodePath === 'orders/order-service');
      expect(driftBefore?.status).toBe('drift');

      await absorbDrift(graph, 'orders/order-service');

      const driftState = await readDriftState(graph.rootPath);
      const entry = driftState.entries['orders/order-service'];
      expect(entry).toBeDefined();

      const currentContent = await readFile(orderServicePath, 'utf-8');
      const expectedHash = hashString(currentContent);
      const storedHash =
        typeof entry.hash === 'string' ? entry.hash : entry.hash['src/orders/order.service.ts'];
      expect(storedHash).toBe(expectedHash);

      // Verify no drift after absorb
      const reportAfter = await detectDrift(graph);
      const okAfter = reportAfter.entries.find((e) => e.nodePath === 'orders/order-service');
      expect(okAfter?.status).toBe('ok');

      // Restore fixture state for other tests
      const { writeDriftState } = await import('../../../src/io/drift-state-store.js');
      driftState.entries['orders/order-service'] = {
        path: 'src/orders/order.service.ts',
        hash: 'sha256:6a9fbc936c3448938fb8d064205186b18bd3adb14ba0a523a8e58e21d21b08d9',
        materialized_at: '2026-02-10T12:00:00Z',
      };
      await writeDriftState(graph.rootPath, driftState);
    });

    it('throws when node not found', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      await expect(absorbDrift(graph, 'nonexistent/node')).rejects.toThrow('Node not found');
    });

    it('throws when node has no mapping', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      await expect(absorbDrift(graph, 'auth')).rejects.toThrow('Node has no mapping');
    });

    it('absorb for multi-file mapping updates all hashes', async () => {
      const tmpDir = path.join(__dirname, '../../fixtures/drift-absorb-multi');
      const yggRoot = path.join(tmpDir, '.yggdrasil');
      const srcDir = path.join(tmpDir, 'src');
      const nodeDir = path.join(yggRoot, 'multi/multi-svc');

      await mkdir(path.join(srcDir, 'multi'), { recursive: true });
      await mkdir(nodeDir, { recursive: true });

      await writeFile(
        path.join(yggRoot, 'config.yaml'),
        'name: Test\nstack: {}\nstandards: {}\ntags: {}',
      );
      await writeFile(path.join(yggRoot, 'multi', 'node.yaml'), 'name: Multi\ntype: module\n');
      await writeFile(
        path.join(nodeDir, 'node.yaml'),
        `name: MultiSvc\ntype: service\nmapping:\n  path:\n    - src/multi/a.ts\n    - src/multi/b.ts\n`,
      );
      await writeFile(path.join(srcDir, 'multi', 'a.ts'), '// a content');
      await writeFile(path.join(srcDir, 'multi', 'b.ts'), '// b content');
      await writeFile(path.join(yggRoot, '.drift-state'), 'entries: {}');

      const graph = await loadGraph(tmpDir);

      // Before absorb: unmaterialized
      const before = await detectDrift(graph, 'multi/multi-svc');
      expect(before.entries[0].status).toBe('unmaterialized');

      // Absorb
      await absorbDrift(graph, 'multi/multi-svc');

      // After absorb: ok
      const after = await detectDrift(graph, 'multi/multi-svc');
      expect(after.entries[0].status).toBe('ok');

      // Verify stored hashes for both files
      const state = await readDriftState(graph.rootPath);
      const entry = state.entries['multi/multi-svc'];
      expect(entry).toBeDefined();
      expect(typeof entry.hash).toBe('object');
      expect(entry.hash).toHaveProperty('src/multi/a.ts');
      expect(entry.hash).toHaveProperty('src/multi/b.ts');

      // Cleanup
      const { rm } = await import('node:fs/promises');
      await rm(tmpDir, { recursive: true, force: true });
    });

    it('skips nodes without mapping during drift detection', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const report = await detectDrift(graph);

      // 'auth' and 'orders' and 'users' modules have no mapping → should not appear
      const nodePathsChecked = report.entries.map((e) => e.nodePath);
      expect(nodePathsChecked).not.toContain('auth');
      expect(nodePathsChecked).not.toContain('orders');
      expect(nodePathsChecked).not.toContain('users');
    });

    it('reports correct totals in drift summary', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const report = await detectDrift(graph);

      expect(report.totalChecked).toBe(report.entries.length);
      expect(report.driftCount).toBe(report.entries.filter((e) => e.status === 'drift').length);
      expect(report.missingCount).toBe(report.entries.filter((e) => e.status === 'missing').length);
    });
  });
});
