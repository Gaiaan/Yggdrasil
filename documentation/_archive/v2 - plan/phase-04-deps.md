# Phase 04 — DependencyResolver (resolve-deps)

## Goal

Implement topological sorting of graph nodes for dependency-ordered materialization, with stage grouping for parallelism, and the `ygg resolve-deps` CLI command.

## Prerequisites

- Phase 02 complete (types, parsers, GraphLoader)

## Spec References

- resolve-deps command: `documentation/v2/06-cli-reference.md` lines 109-189
- Dependency ordering: `documentation/v2/08-materialization.md` lines 59-93
- Stages and parallelism: `documentation/v2/08-materialization.md` lines 71-82

---

## Step 1: Create `src/core/dependency-resolver.ts`

### Algorithm (Kahn's topological sort with stage grouping)

```
function resolveStages(graph, mode):
  // 1. Collect target nodes based on mode
  candidates = selectCandidates(graph, mode)  // all / changed / specific

  // 2. Filter out blackbox nodes
  candidates = candidates.filter(n => !n.meta.blackbox)

  // 3. Build adjacency list and in-degree map
  //    Edge: A -> B means "A depends on B" (A has relation to B)
  //    So B must be materialized BEFORE A
  inDegree = {}
  dependents = {}  // B -> [A, C, ...] (nodes that depend on B)

  for each node in candidates:
    inDegree[node.path] = 0
    dependents[node.path] = []

  for each node in candidates:
    for each relation in node.meta.relations:
      if relation.target in candidates:
        inDegree[node.path] += 1
        dependents[relation.target].push(node.path)

  // 4. Detect cycles
  //    If after processing, some nodes still have inDegree > 0 → cycle

  // 5. Kahn's algorithm with stage grouping
  stages = []
  stageNum = 1
  queue = [nodes where inDegree == 0]

  while queue is not empty:
    stage = { stage: stageNum, parallel: queue.length > 1, nodes: queue }
    stages.push(stage)

    nextQueue = []
    for each node in queue:
      for each dependent in dependents[node]:
        inDegree[dependent] -= 1
        if inDegree[dependent] == 0:
          nextQueue.push(dependent)

    queue = nextQueue
    stageNum += 1

  // 6. Check for cycles
  if any node still has inDegree > 0:
    throw "Circular dependency detected"

  return stages
```

### Mode: `--changed`

Compare timestamps of graph files vs mapped code files:

```typescript
async function findChangedNodes(graph: Graph): Promise<string[]> {
  const changed: string[] = [];

  for (const [nodePath, node] of graph.nodes) {
    if (node.meta.blackbox) continue;
    if (!node.meta.mapping) continue;

    const mappingPaths = normalizeMappingPaths(node.meta.mapping);
    const nodeDir = path.join(graph.rootPath, nodePath);

    // Get latest modification time of graph files
    const graphMtime = await getLatestMtime(nodeDir);

    // Get latest modification time of code files
    for (const mp of mappingPaths) {
      const codePath = path.join(path.dirname(graph.rootPath), mp);
      try {
        const codeMtime = (await stat(codePath)).mtimeMs;
        if (graphMtime > codeMtime) {
          changed.push(nodePath);
          break;
        }
      } catch {
        // File doesn't exist → needs materialization
        changed.push(nodePath);
        break;
      }
    }
  }

  // Also include nodes that depend on changed nodes (cascade)
  return expandWithDependents(graph, changed);
}
```

### Full implementation

```typescript
import type { Graph, GraphNode, Stage } from '../model/types.js';
import { normalizeMappingPaths } from '../utils/paths.js';
import { stat, readdir } from 'node:fs/promises';
import path from 'node:path';

export interface ResolveOptions {
  mode: 'all' | 'changed' | 'node';
  nodePath?: string; // required when mode === 'node'
}

export async function resolveDeps(
  graph: Graph,
  options: ResolveOptions,
): Promise<Stage[]> {
  // 1. Select candidate nodes
  let candidatePaths: string[];

  switch (options.mode) {
    case 'all':
      candidatePaths = [...graph.nodes.keys()];
      break;
    case 'changed':
      candidatePaths = await findChangedNodes(graph);
      break;
    case 'node':
      candidatePaths = collectTransitiveDeps(graph, options.nodePath!);
      break;
  }

  // 2. Filter out blackbox and nodes without mapping
  candidatePaths = candidatePaths.filter(p => {
    const node = graph.nodes.get(p)!;
    return !node.meta.blackbox && node.meta.mapping;
  });

  if (candidatePaths.length === 0) return [];

  const candidateSet = new Set(candidatePaths);

  // 3. Build in-degree and dependents maps
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const p of candidatePaths) {
    inDegree.set(p, 0);
    dependents.set(p, []);
  }

  for (const p of candidatePaths) {
    const node = graph.nodes.get(p)!;
    for (const rel of node.meta.relations ?? []) {
      if (candidateSet.has(rel.target)) {
        inDegree.set(p, (inDegree.get(p) ?? 0) + 1);
        dependents.get(rel.target)!.push(p);
      }
    }
  }

  // 4. Kahn's algorithm with stage grouping
  const stages: Stage[] = [];
  let queue = candidatePaths.filter(p => inDegree.get(p) === 0);
  let stageNum = 1;
  const processed = new Set<string>();

  while (queue.length > 0) {
    stages.push({
      stage: stageNum,
      parallel: queue.length > 1,
      nodes: [...queue],
    });

    const nextQueue: string[] = [];
    for (const nodePath of queue) {
      processed.add(nodePath);
      for (const dep of dependents.get(nodePath) ?? []) {
        inDegree.set(dep, (inDegree.get(dep) ?? 0) - 1);
        if (inDegree.get(dep) === 0) {
          nextQueue.push(dep);
        }
      }
    }

    queue = nextQueue;
    stageNum++;
  }

  // 5. Cycle detection
  if (processed.size < candidatePaths.length) {
    const cycleNodes = candidatePaths.filter(p => !processed.has(p));
    throw new Error(
      `Circular dependency detected involving: ${cycleNodes.join(', ')}`
    );
  }

  return stages;
}
```

---

## Step 2: Create CLI command `src/cli/resolve-deps.ts`

```typescript
import { Command } from 'commander';
import { loadGraph } from '../core/graph-loader.js';
import { resolveDeps } from '../core/dependency-resolver.js';

export function registerResolveDepsCommand(program: Command): void {
  program
    .command('resolve-deps')
    .description('Compute dependency tree and materialization order')
    .option('--changed', 'Only changed nodes (graph newer than code)')
    .option('--node <path>', 'Specific node and its dependencies')
    .option('--format <format>', 'Output format: text or json', 'text')
    .action(async (options) => {
      try {
        const graph = await loadGraph(process.cwd());
        const mode = options.node ? 'node'
          : options.changed ? 'changed'
          : 'all';

        const stages = await resolveDeps(graph, {
          mode,
          nodePath: options.node,
        });

        if (options.format === 'json') {
          process.stdout.write(JSON.stringify({ stages }, null, 2));
        } else {
          for (const stage of stages) {
            const par = stage.parallel ? ' (parallel)' : '';
            process.stdout.write(`Stage ${stage.stage}${par}:\n`);
            for (const n of stage.nodes) {
              process.stdout.write(`  - ${n}\n`);
            }
            process.stdout.write('\n');
          }
        }
      } catch (error) {
        const msg = (error as Error).message;
        process.stderr.write(`Error: ${msg}\n`);
        if (msg.includes('Circular')) process.exit(1);
        if (msg.includes('not found')) process.exit(2);
        process.exit(1);
      }
    });
}
```

---

## Step 3: Tests

1. **Linear chain** A->B->C → stages: [C], [B], [A]
2. **Diamond** A->B, A->C, B->D, C->D → stages: [D], [B,C], [A]
3. **Independent nodes** A, B, C (no relations) → single stage with parallel: true
4. **Cycle detection** A->B, B->A → throws error
5. **Blackbox exclusion** — blackbox nodes excluded from stages
6. **--changed mode** — mock file timestamps, verify only changed nodes returned

---

## Verification

```bash
npm run build && npm test
```

## Acceptance Criteria

- [ ] Topological sort produces correct order
- [ ] Independent nodes grouped in parallel stages
- [ ] Cycles detected and reported with involved node paths
- [ ] Blackbox nodes excluded
- [ ] `--changed` mode compares graph vs code timestamps
- [ ] `--node` mode includes transitive dependencies
- [ ] Text and JSON output formats work
- [ ] Exit codes: 0 success, 1 cycle, 2 broken relation
