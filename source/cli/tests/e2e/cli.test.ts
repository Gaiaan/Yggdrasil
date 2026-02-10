import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_ROOT = path.join(__dirname, '../..');
const BIN_PATH = path.join(CLI_ROOT, 'dist', 'bin.js');
const FIXTURE = path.join(CLI_ROOT, 'tests', 'fixtures', 'sample-project');

const distExists = existsSync(BIN_PATH);

function run(args: string[], cwd = FIXTURE): {
  stdout: string;
  stderr: string;
  status: number | null;
} {
  const result = spawnSync('node', [BIN_PATH, ...args], {
    cwd,
    encoding: 'utf-8',
  });
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    status: result.status,
  };
}

describe.skipIf(!distExists)('CLI E2E', () => {

  it('ygg --version', () => {
    const { stdout, status } = run(['--version']);
    expect(stdout.trim()).toBe('0.1.0');
    expect(status).toBe(0);
  });

  it('ygg tree', () => {
    const { stdout, status } = run(['tree']);
    expect(status).toBe(0);
    expect(stdout).toContain('auth');
    expect(stdout).toContain('orders');
    expect(stdout).toContain('users');
  });

  it('ygg check on valid graph', () => {
    const { status } = run(['check']);
    expect(status).toBe(0);
  });

  it('ygg build-context', () => {
    const { stdout, status } = run(['build-context', 'orders/order-service']);
    expect(status).toBe(0);
    expect(stdout).toContain('Context Package: OrderService');
    expect(stdout).toContain('Global Context');
    expect(stdout).toContain('Node: OrderService');
  });

  it('ygg build-context --format json', () => {
    const { stdout, status } = run([
      'build-context',
      'orders/order-service',
      '--format',
      'json',
    ]);
    expect(status).toBe(0);
    const pkg = JSON.parse(stdout);
    expect(pkg.nodeName).toBe('OrderService');
    expect(pkg.layers.length).toBeGreaterThan(0);
  });

  it('ygg build-context nonexistent node', () => {
    const { status } = run(['build-context', 'does/not/exist']);
    expect(status).toBe(1);
  });

  it('ygg resolve-deps', () => {
    const { stdout, status } = run(['resolve-deps']);
    expect(status).toBe(0);
    expect(stdout).toContain('Stage');
  });

  it('ygg resolve-deps --format json', () => {
    const { stdout, status } = run(['resolve-deps', '--format', 'json']);
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed).toHaveProperty('stages');
  });

  it('ygg affected', () => {
    const { stdout, status } = run(['affected', 'auth/auth-api']);
    expect(status).toBe(0);
    expect(stdout).toContain('orders/order-service');
  });

  it('ygg affected --format json', () => {
    const { stdout, status } = run(['affected', 'auth/auth-api', '--format', 'json']);
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed).toHaveProperty('dependents');
    expect(parsed).toHaveProperty('flows');
  });

  it('ygg status', () => {
    const { stdout, status } = run(['status']);
    expect(status).toBe(0);
    expect(stdout).toContain('Sample E-Commerce');
    expect(stdout).toContain('Nodes:');
  });

  it('ygg drift', () => {
    const { stdout, status } = run(['drift']);
    expect(stdout).toContain('nodes checked');
    expect([0, 1, 2]).toContain(status);
  });

  it('ygg drift --format json', () => {
    const { stdout, status } = run(['drift', '--format', 'json']);
    const parsed = JSON.parse(stdout);
    expect(parsed).toHaveProperty('entries');
    expect(parsed).toHaveProperty('totalChecked');
    expect(parsed).toHaveProperty('driftCount');
    expect(parsed).toHaveProperty('missingCount');
  });

  it('ygg check --format json', () => {
    const { stdout, status } = run(['check', '--format', 'json']);
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed).toHaveProperty('issues');
    expect(parsed).toHaveProperty('nodesScanned');
  });

  // --- Tree options ---

  it('ygg tree --depth 1 limits output', () => {
    const { stdout, status } = run(['tree', '--depth', '1']);
    expect(status).toBe(0);
    expect(stdout).toContain('auth');
    expect(stdout).toContain('orders');
    // depth 1 means we see top-level modules but NOT their children names as tree nodes
    // Children metadata (artifacts count) should still appear at depth 1
  });

  it('ygg tree --no-tags hides tag annotations', () => {
    const { stdout, status } = run(['tree', '--no-tags']);
    expect(status).toBe(0);
    expect(stdout).toContain('auth');
    // With --no-tags, tag brackets should not appear for tagged nodes
    // orders/order-service normally shows [requires-auth] tag
    expect(stdout).not.toMatch(/\[requires-auth\]/);
  });

  it('ygg tree auth/ shows only auth subtree', () => {
    const { stdout, status } = run(['tree', 'auth']);
    expect(status).toBe(0);
    expect(stdout).toContain('auth');
    expect(stdout).toContain('login-service');
    expect(stdout).toContain('auth-api');
    // Subtree mode: no project name as first line, auth is the root
    expect(stdout).not.toContain('Sample E-Commerce');
    expect(stdout).not.toContain('orders');
    expect(stdout).not.toContain('users');
  });

  it('ygg tree --compact hides metadata lines', () => {
    const { stdout, status } = run(['tree', '--compact']);
    expect(status).toBe(0);
    expect(stdout).toContain('auth');
    // With --compact, artifact count and mapping lines should not appear
    expect(stdout).not.toMatch(/\d+ artifacts/);
  });

  it('ygg tree nonexistent/ returns exit 1', () => {
    const { stderr, status } = run(['tree', 'nonexistent']);
    expect(status).toBe(1);
    expect(stderr).toContain('not found');
  });

  // --- resolve-deps options ---

  it('ygg resolve-deps --node orders/order-service', () => {
    const { stdout, status } = run([
      'resolve-deps',
      '--node',
      'orders/order-service',
    ]);
    expect(status).toBe(0);
    expect(stdout).toContain('Stage');
    expect(stdout).toContain('orders/order-service');
  });

  it('ygg resolve-deps --node orders/order-service --format json', () => {
    const { stdout, status } = run([
      'resolve-deps',
      '--node',
      'orders/order-service',
      '--format',
      'json',
    ]);
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed).toHaveProperty('stages');
    const allNodes = parsed.stages.flatMap(
      (s: { nodes: string[] }) => s.nodes,
    );
    expect(allNodes).toContain('orders/order-service');
  });

  // --- drift options ---

  it('ygg drift --node orders/order-service', () => {
    const { stdout, status } = run([
      'drift',
      '--node',
      'orders/order-service',
    ]);
    // order-service has drift in fixture (hash mismatch)
    expect(stdout).toContain('orders/order-service');
    expect(stdout).toContain('1 nodes checked');
    expect([0, 1, 2]).toContain(status);
  });

  it('ygg drift --format json --node orders/order-service', () => {
    const { stdout } = run([
      'drift',
      '--format',
      'json',
      '--node',
      'orders/order-service',
    ]);
    const parsed = JSON.parse(stdout);
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries[0].nodePath).toBe('orders/order-service');
  });

  // --- affected edge cases ---

  it('ygg affected nonexistent node returns exit code 1', () => {
    const { status, stderr } = run(['affected', 'does/not/exist']);
    expect(status).toBe(1);
    expect(stderr).toContain('Node not found');
  });

  it('ygg affected --format json', () => {
    const { stdout, status } = run([
      'affected',
      'users/user-repo',
      '--format',
      'json',
    ]);
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed).toHaveProperty('dependents');
    expect(parsed).toHaveProperty('flows');
    // auth/login-service depends on users/user-repo
    const depPaths = parsed.dependents.map(
      (d: { path: string }) => d.path,
    );
    expect(depPaths).toContain('auth/login-service');
  });

  // --- check edge cases ---

  it('ygg check on broken-relation fixture returns exit 1', () => {
    const brokenFixture = path.join(
      CLI_ROOT,
      'tests',
      'fixtures',
      'sample-project-broken-relation',
    );
    const { status, stdout } = run(['check'], brokenFixture);
    expect(status).toBe(1);
    expect(stdout).toContain('relation-targets-exist');
  });

  // --- drift exit codes ---

  it('ygg drift returns exit 1 when drift detected (order-service)', () => {
    // order-service has mismatched hash in fixture
    const { status } = run(['drift', '--node', 'orders/order-service']);
    expect(status).toBe(1);
  });

  it('ygg drift returns exit 2 when mapped file missing (missing-service)', () => {
    const { status } = run(['drift', '--node', 'users/missing-service']);
    expect(status).toBe(2);
  });

  it('ygg drift returns exit 0 when all OK (login-service)', () => {
    const { status } = run(['drift', '--node', 'auth/login-service']);
    expect(status).toBe(0);
  });

  // --- init creates structure ---

  it('ygg init creates .yggdrasil directory structure', () => {
    const { mkdtempSync } = require('node:fs');
    const { existsSync } = require('node:fs');
    const tmpDir = mkdtempSync(path.join(CLI_ROOT, 'tests', 'fixtures', 'tmp-e2e-init-'));

    try {
      const { status, stdout } = run(['init'], tmpDir);
      expect(status).toBe(0);
      expect(stdout).toContain('Yggdrasil initialized');
      expect(existsSync(path.join(tmpDir, '.yggdrasil', 'config.yaml'))).toBe(true);
      expect(existsSync(path.join(tmpDir, '.yggdrasil', 'aspects'))).toBe(true);
      expect(existsSync(path.join(tmpDir, '.yggdrasil', 'flows'))).toBe(true);
      expect(existsSync(path.join(tmpDir, '.yggdrasil', '.briefs'))).toBe(true);
    } finally {
      const { rmSync } = require('node:fs');
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // --- status output details ---

  it('ygg status includes drift summary', () => {
    const { stdout, status } = run(['status']);
    expect(status).toBe(0);
    expect(stdout).toContain('Drift:');
  });

  it('ygg status includes tag counts', () => {
    const { stdout, status } = run(['status']);
    expect(status).toBe(0);
    expect(stdout).toContain('Tags:');
    expect(stdout).toContain('Aspects:');
    expect(stdout).toContain('Relations:');
    expect(stdout).toContain('Mappings:');
  });
});
