import type { Graph, Stage } from '../model/types.js';
import { normalizeMappingPaths } from '../utils/paths.js';
import { stat, readdir } from 'node:fs/promises';
import path from 'node:path';

export interface ResolveOptions {
  mode: 'all' | 'changed' | 'node';
  nodePath?: string; // required when mode === 'node'
}

/** Get latest modification time of files in a directory (recursive) */
async function getLatestMtime(dirPath: string): Promise<number> {
  let maxMtime = 0;
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.')) continue;
      const subMtime = await getLatestMtime(fullPath);
      maxMtime = Math.max(maxMtime, subMtime);
    } else {
      const st = await stat(fullPath);
      maxMtime = Math.max(maxMtime, st.mtimeMs);
    }
  }
  return maxMtime;
}

/** Expand changed set with nodes that depend on changed nodes (cascade) */
function expandWithDependents(graph: Graph, changed: string[]): string[] {
  const dependents = new Map<string, string[]>();
  for (const [nodePath, node] of graph.nodes) {
    for (const rel of node.meta.relations ?? []) {
      const deps = dependents.get(rel.target) ?? [];
      deps.push(nodePath);
      dependents.set(rel.target, deps);
    }
  }

  const result = new Set<string>(changed);
  const queue = [...changed];

  while (queue.length > 0) {
    const node = queue.shift()!;
    for (const dep of dependents.get(node) ?? []) {
      if (!result.has(dep)) {
        result.add(dep);
        queue.push(dep);
      }
    }
  }

  return [...result];
}

/** Find nodes whose graph files are newer than mapped code files */
export async function findChangedNodes(graph: Graph): Promise<string[]> {
  const changed: string[] = [];

  for (const [nodePath, node] of graph.nodes) {
    if (node.meta.blackbox) continue;
    if (!node.meta.mapping) continue;

    const mappingPaths = normalizeMappingPaths(node.meta.mapping);
    const nodeDir = path.join(graph.rootPath, nodePath);

    const graphMtime = await getLatestMtime(nodeDir);

    for (const mp of mappingPaths) {
      const codePath = path.join(path.dirname(graph.rootPath), mp);
      try {
        const codeMtime = (await stat(codePath)).mtimeMs;
        if (graphMtime > codeMtime) {
          changed.push(nodePath);
          break;
        }
      } catch {
        changed.push(nodePath);
        break;
      }
    }
  }

  return expandWithDependents(graph, changed);
}

/** Collect node and its transitive dependencies (for --node mode) */
export function collectTransitiveDeps(graph: Graph, nodePath: string): string[] {
  const node = graph.nodes.get(nodePath);
  if (!node) {
    throw new Error(`Node not found: ${nodePath}`);
  }

  const result = new Set<string>();
  const queue = [nodePath];

  while (queue.length > 0) {
    const p = queue.shift()!;
    if (result.has(p)) continue;
    result.add(p);

    const n = graph.nodes.get(p)!;
    for (const rel of n.meta.relations ?? []) {
      if (!graph.nodes.has(rel.target)) {
        throw new Error(`Relation target not found: ${rel.target}`);
      }
      if (!result.has(rel.target)) {
        queue.push(rel.target);
      }
    }
  }

  return [...result];
}

export async function resolveDeps(graph: Graph, options: ResolveOptions): Promise<Stage[]> {
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

  candidatePaths = candidatePaths.filter((p) => {
    const node = graph.nodes.get(p)!;
    return !node.meta.blackbox && node.meta.mapping;
  });

  if (candidatePaths.length === 0) return [];

  const candidateSet = new Set(candidatePaths);

  // Validate relations: broken relation = target not in graph
  for (const p of candidatePaths) {
    const node = graph.nodes.get(p)!;
    for (const rel of node.meta.relations ?? []) {
      if (!graph.nodes.has(rel.target)) {
        throw new Error(`Relation target not found: ${rel.target}`);
      }
    }
  }

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

  const stages: Stage[] = [];
  let queue = candidatePaths.filter((p) => inDegree.get(p) === 0);
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

  if (processed.size < candidatePaths.length) {
    const cycleNodes = candidatePaths.filter((p) => !processed.has(p));
    throw new Error(`Circular dependency detected involving: ${cycleNodes.join(', ')}`);
  }

  return stages;
}
