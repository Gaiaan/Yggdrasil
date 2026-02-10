# Phase 06 — DriftDetector (drift)

## Goal

Implement drift detection (comparing code file hashes against stored state) and the `ygg drift` CLI command with `--absorb` support.

## Prerequisites

- Phase 02 complete (types, parsers, drift-state-store, hash utility)

## Spec References

- Drift detection: `documentation/v2/09-drift-detection.md` (full document)
- drift command: `documentation/v2/06-cli-reference.md` lines 243-285
- .drift-state format: `documentation/v2/09-drift-detection.md` lines 26-39

---

## Step 1: Create `src/core/drift-detector.ts`

```typescript
import type {
  Graph, DriftReport, DriftEntry, DriftState, DriftStatus,
} from '../model/types.js';
import { readDriftState, writeDriftState } from '../io/drift-state-store.js';
import { hashFile } from '../utils/hash.js';
import { normalizeMappingPaths } from '../utils/paths.js';
import { access } from 'node:fs/promises';
import path from 'node:path';

export async function detectDrift(
  graph: Graph,
  filterNodePath?: string,
): Promise<DriftReport> {
  const projectRoot = path.dirname(graph.rootPath);
  const driftState = await readDriftState(graph.rootPath);
  const entries: DriftEntry[] = [];

  for (const [nodePath, node] of graph.nodes) {
    if (filterNodePath && nodePath !== filterNodePath) continue;
    if (!node.meta.mapping) continue;

    const mappingPaths = normalizeMappingPaths(node.meta.mapping);
    const stateEntry = driftState.entries[nodePath];

    if (!stateEntry) {
      // No drift state recorded → unmaterialized
      entries.push({
        nodePath,
        mappingPaths,
        status: 'unmaterialized',
        details: 'No drift state recorded',
      });
      continue;
    }

    // Check each mapped file
    let status: DriftStatus = 'ok';
    let details = '';

    for (const mp of mappingPaths) {
      const absPath = path.join(projectRoot, mp);
      try {
        await access(absPath);
        const currentHash = await hashFile(absPath);
        const storedHash = typeof stateEntry.hash === 'string'
          ? stateEntry.hash
          : stateEntry.hash[mp];

        if (currentHash !== storedHash) {
          status = 'drift';
          details = `File modified since last materialization: ${mp}`;
          break; // One drifted file is enough to flag the node
        }
      } catch {
        status = 'missing';
        details = `Mapped file does not exist: ${mp}`;
        break;
      }
    }

    entries.push({ nodePath, mappingPaths, status, details });
  }

  return {
    entries,
    totalChecked: entries.length,
    driftCount: entries.filter(e => e.status === 'drift').length,
    missingCount: entries.filter(e => e.status === 'missing').length,
  };
}

/**
 * Absorb drift: update .drift-state with current file hashes.
 */
export async function absorbDrift(
  graph: Graph,
  nodePath: string,
): Promise<void> {
  const projectRoot = path.dirname(graph.rootPath);
  const node = graph.nodes.get(nodePath);
  if (!node) throw new Error(`Node not found: ${nodePath}`);
  if (!node.meta.mapping) throw new Error(`Node has no mapping: ${nodePath}`);

  const mappingPaths = normalizeMappingPaths(node.meta.mapping);
  const driftState = await readDriftState(graph.rootPath);

  // Compute current hashes
  const hashes: Record<string, string> = {};
  for (const mp of mappingPaths) {
    hashes[mp] = await hashFile(path.join(projectRoot, mp));
  }

  // Update drift state entry
  driftState.entries[nodePath] = {
    path: mappingPaths.length === 1 ? mappingPaths[0] : mappingPaths,
    hash: mappingPaths.length === 1 ? hashes[mappingPaths[0]] : hashes,
    materialized_at: new Date().toISOString(),
  };

  await writeDriftState(graph.rootPath, driftState);
}
```

---

## Step 2: Create CLI command `src/cli/drift.ts`

```typescript
import { Command } from 'commander';
import { loadGraph } from '../core/graph-loader.js';
import { detectDrift, absorbDrift } from '../core/drift-detector.js';
import chalk from 'chalk';

export function registerDriftCommand(program: Command): void {
  program
    .command('drift')
    .description('Detect divergence between graph and code')
    .option('--node <path>', 'Check specific node only')
    .option('--absorb <path>', 'Absorb drift for a node (update .drift-state)')
    .option('--format <format>', 'Output format: text or json', 'text')
    .action(async (options) => {
      try {
        const graph = await loadGraph(process.cwd());

        // Handle --absorb
        if (options.absorb) {
          await absorbDrift(graph, options.absorb);
          process.stdout.write(`Drift absorbed for ${options.absorb}\n`);
          process.exit(0);
        }

        // Normal drift detection
        const report = await detectDrift(graph, options.node);

        if (options.format === 'json') {
          process.stdout.write(JSON.stringify(report, null, 2));
        } else {
          for (const entry of report.entries) {
            const paths = entry.mappingPaths.join(', ');
            process.stdout.write(`${entry.nodePath} → ${paths}\n`);

            switch (entry.status) {
              case 'ok':
                process.stdout.write(chalk.green('  ✓ OK: matches last materialization\n'));
                break;
              case 'drift':
                process.stdout.write(chalk.red(`  ✗ DRIFT: ${entry.details}\n`));
                break;
              case 'missing':
                process.stdout.write(chalk.yellow(`  ✗ MISSING: ${entry.details}\n`));
                break;
              case 'unmaterialized':
                process.stdout.write(chalk.dim(`  - UNMATERIALIZED: ${entry.details}\n`));
                break;
            }
            process.stdout.write('\n');
          }
          process.stdout.write(
            `${report.totalChecked} nodes checked. ` +
            `${report.driftCount} drift, ${report.missingCount} missing.\n`
          );
        }

        // Exit codes
        if (report.driftCount > 0) process.exit(1);
        if (report.missingCount > 0) process.exit(2);
        process.exit(0);
      } catch (error) {
        process.stderr.write(`Error: ${(error as Error).message}\n`);
        process.exit(1);
      }
    });
}
```

---

## Step 3: Tests

Test against a fixture with:
- A `.drift-state` file with known hashes
- Source code files matching some hashes (OK), differing others (DRIFT), missing one (MISSING)
- A node with mapping but no drift-state entry (UNMATERIALIZED)

Tests:
1. **OK state** — file hash matches stored hash
2. **DRIFT state** — file hash differs from stored hash
3. **MISSING state** — mapped file does not exist
4. **UNMATERIALIZED state** — no drift-state entry for node
5. **Multi-file mapping** — drift if any single file changed
6. **absorbDrift** — updates .drift-state with current hashes
7. **--node filter** — only checks specified node

---

## Acceptance Criteria

- [ ] Detects OK, DRIFT, MISSING, UNMATERIALIZED states correctly
- [ ] Multi-file mapping: any changed file flags the node
- [ ] `--absorb` updates .drift-state with current hashes
- [ ] Text output with colored status markers
- [ ] JSON output with full report structure
- [ ] Exit code 0 (clean), 1 (drift), 2 (missing)
- [ ] Tests pass for all drift states
