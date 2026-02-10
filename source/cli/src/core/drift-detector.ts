import type { Graph, DriftReport, DriftEntry, DriftStatus } from '../model/types.js';
import { readDriftState, writeDriftState } from '../io/drift-state-store.js';
import { hashFile } from '../utils/hash.js';
import { normalizeMappingPaths } from '../utils/paths.js';
import { access } from 'node:fs/promises';
import path from 'node:path';

export async function detectDrift(graph: Graph, filterNodePath?: string): Promise<DriftReport> {
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
        const storedHash =
          typeof stateEntry.hash === 'string' ? stateEntry.hash : stateEntry.hash[mp];

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
    driftCount: entries.filter((e) => e.status === 'drift').length,
    missingCount: entries.filter((e) => e.status === 'missing').length,
  };
}

/**
 * Absorb drift: update .drift-state with current file hashes.
 */
export async function absorbDrift(graph: Graph, nodePath: string): Promise<void> {
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
