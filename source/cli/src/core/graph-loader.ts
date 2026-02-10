import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import type { Graph, GraphNode, AspectDef, FlowDef } from '../model/types.js';
import { parseConfig } from '../io/config-parser.js';
import { parseNodeYaml } from '../io/node-parser.js';
import { parseAspect } from '../io/aspect-parser.js';
import { parseFlow } from '../io/flow-parser.js';
import { readArtifacts } from '../io/artifact-reader.js';
import { findYggRoot, toGraphPath } from '../utils/paths.js';

/** Reserved directories that are NOT nodes */
const RESERVED_DIRS = new Set(['aspects', 'flows', '.briefs']);

export async function loadGraph(projectRoot: string): Promise<Graph> {
  const yggRoot = await findYggRoot(projectRoot);
  const config = await parseConfig(path.join(yggRoot, 'config.yaml'));

  // Scan nodes recursively
  const nodes = new Map<string, GraphNode>();
  await scanDirectory(yggRoot, yggRoot, null, nodes);

  // Load aspects
  const aspects = await loadAspects(path.join(yggRoot, 'aspects'));

  // Load flows
  const flows = await loadFlows(path.join(yggRoot, 'flows'), yggRoot);

  return { config, nodes, aspects, flows, rootPath: yggRoot };
}

async function scanDirectory(
  dirPath: string,
  yggRoot: string,
  parent: GraphNode | null,
  nodes: Map<string, GraphNode>,
): Promise<void> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const hasNodeYaml = entries.some((e) => e.isFile() && e.name === 'node.yaml');

  if (!hasNodeYaml && dirPath !== yggRoot) {
    // Not a node directory — skip (but this might be flagged by validator)
    return;
  }

  // If this IS a node (has node.yaml), create the GraphNode
  if (hasNodeYaml) {
    const graphPath = toGraphPath(dirPath, yggRoot);
    const meta = await parseNodeYaml(path.join(dirPath, 'node.yaml'));
    const artifacts = await readArtifacts(dirPath, ['node.yaml']);

    const node: GraphNode = {
      path: graphPath,
      meta,
      artifacts,
      children: [],
      parent,
    };

    nodes.set(graphPath, node);
    if (parent) {
      parent.children.push(node);
    }

    // Recurse into subdirectories (potential child nodes)
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (RESERVED_DIRS.has(entry.name)) continue;
      if (entry.name.startsWith('.')) continue;

      await scanDirectory(
        path.join(dirPath, entry.name),
        yggRoot,
        node, // this node is the parent
        nodes,
      );
    }
  } else {
    // yggRoot itself — scan for top-level node directories
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (RESERVED_DIRS.has(entry.name)) continue;
      if (entry.name.startsWith('.')) continue;

      await scanDirectory(
        path.join(dirPath, entry.name),
        yggRoot,
        null, // top-level nodes have no parent
        nodes,
      );
    }
  }
}

async function loadAspects(aspectsDir: string): Promise<AspectDef[]> {
  try {
    const entries = await readdir(aspectsDir, { withFileTypes: true });
    const aspects: AspectDef[] = [];
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith('.yaml') && !entry.name.endsWith('.yml')) continue;
      aspects.push(await parseAspect(path.join(aspectsDir, entry.name)));
    }
    return aspects;
  } catch {
    return []; // aspects/ directory may not exist
  }
}

async function loadFlows(flowsDir: string, yggRoot: string): Promise<FlowDef[]> {
  try {
    const entries = await readdir(flowsDir, { withFileTypes: true });
    const flows: FlowDef[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      // Each flow is a directory with flow.yaml
      const flowYaml = path.join(flowsDir, entry.name, 'flow.yaml');
      try {
        await stat(flowYaml);
        flows.push(await parseFlow(path.join(flowsDir, entry.name), yggRoot));
      } catch {
        // Directory without flow.yaml — skip
      }
    }
    return flows;
  } catch {
    return []; // flows/ directory may not exist
  }
}
