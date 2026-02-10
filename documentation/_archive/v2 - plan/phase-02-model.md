# Phase 02 — Data Model, Parsers, GraphLoader

## Goal

Create the TypeScript type system, YAML parsers for all graph file types, and the GraphLoader that assembles the complete in-memory graph from `yggdrasil/` directory.

## Prerequisites

- Phase 01 complete (`npm run build` works, `bin.ts` runs)

## Spec References

- `node.yaml` schema: `documentation/v2/03-graph-structure.md` lines 69-92
- `config.yaml` schema: `documentation/v2/03-graph-structure.md` lines 209-247
- Aspect file format: `documentation/v2/03-graph-structure.md` lines 272-303
- `flow.yaml` schema: `documentation/v2/03-graph-structure.md` lines 344-356
- `.drift-state` format: `documentation/v2/09-drift-detection.md` lines 26-39
- Artifact rules: `documentation/v2/03-graph-structure.md` lines 155-186

---

## Step 1: Create `src/model/types.ts`

This is the complete type system for the project. All other modules import from here.

```typescript
// ============================================================
// Config
// ============================================================

export interface YggConfig {
  name: string;
  stack: Record<string, string>;
  standards: Record<string, string>;
  limits?: {
    context_warning_tokens?: number;
  };
  tags: Record<string, TagDefinition>;
}

export interface TagDefinition {
  description: string;
  propagates?: boolean;
  conflicts_with?: string[];
}

// ============================================================
// Node
// ============================================================

export interface NodeMeta {
  name: string;
  type: string;
  tags?: string[];
  relations?: Relation[];
  mapping?: NodeMapping;
  blackbox?: boolean;
}

export interface Relation {
  target: string; // path relative to yggdrasil/
  type: string;   // uses, calls, reads, implements, etc.
}

export interface NodeMapping {
  path: string | string[]; // single file, list of files, or directory
}

export interface GraphNode {
  /** Path relative to yggdrasil/, e.g. "orders/order-service" */
  path: string;
  /** Parsed node.yaml content */
  meta: NodeMeta;
  /** All artifact files in the node's directory */
  artifacts: Artifact[];
  /** Child nodes (subdirectories with node.yaml) */
  children: GraphNode[];
  /** Parent node (null for top-level nodes) */
  parent: GraphNode | null;
}

export interface Artifact {
  /** Filename, e.g. "description.md" */
  filename: string;
  /** Full text content of the file */
  content: string;
}

// ============================================================
// Aspect
// ============================================================

export interface AspectDef {
  name: string;
  tag: string;
  description: string;
  requirements?: string[];
  /** Raw file content (the full YAML as string, for inclusion in context) */
  rawContent: string;
}

// ============================================================
// Flow
// ============================================================

export interface FlowDef {
  name: string;
  /** List of participating node paths (relative to yggdrasil/) */
  nodes: string[];
  /** Artifact files in the flow directory */
  artifacts: Artifact[];
  /** Path to flow directory relative to yggdrasil/ */
  dirPath: string;
}

// ============================================================
// Graph (top-level)
// ============================================================

export interface Graph {
  config: YggConfig;
  /** All nodes indexed by their path (e.g. "orders/order-service") */
  nodes: Map<string, GraphNode>;
  aspects: AspectDef[];
  flows: FlowDef[];
  /** Absolute path to the yggdrasil/ directory */
  rootPath: string;
}

// ============================================================
// Context Package
// ============================================================

export interface ContextPackage {
  nodePath: string;
  nodeName: string;
  layers: ContextLayer[];
  mapping: string[] | null;
  tokenCount: number;
}

export interface ContextLayer {
  type: 'global' | 'hierarchy' | 'own' | 'relational' | 'aspects' | 'flows';
  label: string;
  content: string;
}

// ============================================================
// Dependency Resolution
// ============================================================

export interface Stage {
  stage: number;
  parallel: boolean;
  nodes: string[]; // node paths
}

// ============================================================
// Validation
// ============================================================

export type IssueSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: IssueSeverity;
  rule: string;
  message: string;
  nodePath?: string;
}

export interface ValidationResult {
  issues: ValidationIssue[];
  nodesScanned: number;
}

// ============================================================
// Drift
// ============================================================

export type DriftStatus = 'ok' | 'drift' | 'missing' | 'unmaterialized';

export interface DriftEntry {
  nodePath: string;
  mappingPaths: string[];
  status: DriftStatus;
  details?: string;
}

export interface DriftState {
  entries: Record<string, DriftStateEntry>;
}

export interface DriftStateEntry {
  path: string | string[];
  hash: string | Record<string, string>; // single hash or per-file hash map
  materialized_at: string; // ISO date
}

export interface DriftReport {
  entries: DriftEntry[];
  totalChecked: number;
  driftCount: number;
  missingCount: number;
}
```

---

## Step 2: Create parsers in `src/io/`

### `src/io/config-parser.ts`

```typescript
import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import type { YggConfig } from '../model/types.js';

export async function parseConfig(filePath: string): Promise<YggConfig> {
  const content = await readFile(filePath, 'utf-8');
  const raw = parseYaml(content) as Record<string, unknown>;

  // Validate required fields
  if (!raw.name || typeof raw.name !== 'string') {
    throw new Error(`config.yaml: missing or invalid 'name' field`);
  }

  return {
    name: raw.name as string,
    stack: (raw.stack as Record<string, string>) ?? {},
    standards: (raw.standards as Record<string, string>) ?? {},
    limits: raw.limits as YggConfig['limits'],
    tags: (raw.tags as Record<string, any>) ?? {},
  };
}
```

### `src/io/node-parser.ts`

```typescript
import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import type { NodeMeta } from '../model/types.js';

export async function parseNodeYaml(filePath: string): Promise<NodeMeta> {
  const content = await readFile(filePath, 'utf-8');
  const raw = parseYaml(content) as Record<string, unknown>;

  if (!raw.name || typeof raw.name !== 'string') {
    throw new Error(`node.yaml at ${filePath}: missing 'name'`);
  }
  if (!raw.type || typeof raw.type !== 'string') {
    throw new Error(`node.yaml at ${filePath}: missing 'type'`);
  }

  // Normalize mapping.path to always be string | string[]
  const mapping = raw.mapping as { path?: string | string[] } | undefined;

  return {
    name: raw.name as string,
    type: raw.type as string,
    tags: (raw.tags as string[]) ?? undefined,
    relations: (raw.relations as NodeMeta['relations']) ?? undefined,
    mapping: mapping ? { path: mapping.path ?? '' } : undefined,
    blackbox: (raw.blackbox as boolean) ?? false,
  };
}
```

### `src/io/aspect-parser.ts`

```typescript
import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import type { AspectDef } from '../model/types.js';

export async function parseAspect(filePath: string): Promise<AspectDef> {
  const content = await readFile(filePath, 'utf-8');
  const raw = parseYaml(content) as Record<string, unknown>;

  if (!raw.name || !raw.tag) {
    throw new Error(`Aspect file ${filePath}: missing 'name' or 'tag'`);
  }

  return {
    name: raw.name as string,
    tag: raw.tag as string,
    description: (raw.description as string) ?? '',
    requirements: (raw.requirements as string[]) ?? undefined,
    rawContent: content,
  };
}
```

### `src/io/flow-parser.ts`

```typescript
import { readFile, readdir } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import path from 'node:path';
import type { FlowDef, Artifact } from '../model/types.js';
import { readArtifacts } from './artifact-reader.js';

export async function parseFlow(flowDirPath: string): Promise<FlowDef> {
  const flowYamlPath = path.join(flowDirPath, 'flow.yaml');
  const content = await readFile(flowYamlPath, 'utf-8');
  const raw = parseYaml(content) as Record<string, unknown>;

  if (!raw.name || !raw.nodes) {
    throw new Error(`flow.yaml at ${flowDirPath}: missing 'name' or 'nodes'`);
  }

  // Read all artifact files in the flow directory (everything except flow.yaml)
  const artifacts = await readArtifacts(flowDirPath, ['flow.yaml']);

  return {
    name: raw.name as string,
    nodes: raw.nodes as string[],
    artifacts,
    dirPath: flowDirPath,
  };
}
```

### `src/io/artifact-reader.ts`

Reads all text-based files from a directory, excluding specified filenames and subdirectories.

```typescript
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import type { Artifact } from '../model/types.js';

/** File extensions considered binary (skip these) */
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg',
  '.pdf', '.zip', '.tar', '.gz', '.woff', '.woff2', '.ttf', '.eot',
]);

export async function readArtifacts(
  dirPath: string,
  excludeFiles: string[] = ['node.yaml'],
): Promise<Artifact[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const artifacts: Artifact[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (excludeFiles.includes(entry.name)) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (BINARY_EXTENSIONS.has(ext)) continue;

    const filePath = path.join(dirPath, entry.name);
    const content = await readFile(filePath, 'utf-8');
    artifacts.push({ filename: entry.name, content });
  }

  // Sort by filename for deterministic output
  artifacts.sort((a, b) => a.filename.localeCompare(b.filename));
  return artifacts;
}
```

### `src/io/drift-state-store.ts`

```typescript
import { readFile, writeFile } from 'node:fs/promises';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import path from 'node:path';
import type { DriftState, DriftStateEntry } from '../model/types.js';

const DRIFT_STATE_FILE = '.drift-state';

export async function readDriftState(yggRoot: string): Promise<DriftState> {
  const filePath = path.join(yggRoot, DRIFT_STATE_FILE);
  try {
    const content = await readFile(filePath, 'utf-8');
    const raw = parseYaml(content) as { entries?: Record<string, DriftStateEntry> };
    return { entries: raw.entries ?? {} };
  } catch {
    // File doesn't exist yet — empty state
    return { entries: {} };
  }
}

export async function writeDriftState(
  yggRoot: string,
  state: DriftState,
): Promise<void> {
  const filePath = path.join(yggRoot, DRIFT_STATE_FILE);
  const header = '# yggdrasil/.drift-state (auto-generated, do not edit manually)\n';
  const content = header + stringifyYaml({ entries: state.entries });
  await writeFile(filePath, content, 'utf-8');
}
```

---

## Step 3: Create utility functions in `src/utils/`

### `src/utils/paths.ts`

```typescript
import path from 'node:path';
import { access } from 'node:fs/promises';

/**
 * Find the yggdrasil/ directory starting from projectRoot.
 * Returns the absolute path to the yggdrasil/ directory.
 */
export async function findYggRoot(projectRoot: string): Promise<string> {
  const yggPath = path.join(projectRoot, 'yggdrasil');
  try {
    await access(yggPath);
    return yggPath;
  } catch {
    throw new Error(
      `No yggdrasil/ directory found in ${projectRoot}. Run 'ygg init' first.`
    );
  }
}

/**
 * Normalize a mapping path to always return an array of strings.
 */
export function normalizeMappingPaths(
  mapping: { path: string | string[] } | undefined,
): string[] {
  if (!mapping) return [];
  return Array.isArray(mapping.path) ? mapping.path : [mapping.path];
}

/**
 * Convert a node's directory path to its graph path.
 * E.g., "/abs/path/yggdrasil/orders/order-service" → "orders/order-service"
 */
export function toGraphPath(absolutePath: string, yggRoot: string): string {
  return path.relative(yggRoot, absolutePath).split(path.sep).join('/');
}
```

### `src/utils/hash.ts`

```typescript
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export async function hashFile(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  return 'sha256:' + createHash('sha256').update(content).digest('hex');
}

export function hashString(content: string): string {
  return 'sha256:' + createHash('sha256').update(content).digest('hex');
}
```

### `src/utils/tokens.ts`

```typescript
/**
 * Estimate token count for a string.
 * Uses js-tiktoken for accuracy (cl100k_base encoding, used by GPT-4/Claude).
 * Falls back to word-based estimation if tiktoken fails.
 */
export async function estimateTokens(text: string): Promise<number> {
  try {
    const { encodingForModel } = await import('js-tiktoken');
    const enc = encodingForModel('gpt-4');
    const tokens = enc.encode(text);
    return tokens.length;
  } catch {
    // Fallback: rough estimate (1 token ≈ 4 characters)
    return Math.ceil(text.length / 4);
  }
}
```

---

## Step 4: Create `src/core/graph-loader.ts`

This is the core file scanner that builds the complete in-memory graph.

```typescript
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
  const flows = await loadFlows(path.join(yggRoot, 'flows'));

  return { config, nodes, aspects, flows, rootPath: yggRoot };
}

async function scanDirectory(
  dirPath: string,
  yggRoot: string,
  parent: GraphNode | null,
  nodes: Map<string, GraphNode>,
): Promise<void> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const hasNodeYaml = entries.some(e => e.isFile() && e.name === 'node.yaml');

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

async function loadFlows(flowsDir: string): Promise<FlowDef[]> {
  try {
    const entries = await readdir(flowsDir, { withFileTypes: true });
    const flows: FlowDef[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      // Each flow is a directory with flow.yaml
      const flowYaml = path.join(flowsDir, entry.name, 'flow.yaml');
      try {
        await stat(flowYaml);
        flows.push(await parseFlow(path.join(flowsDir, entry.name)));
      } catch {
        // Directory without flow.yaml — skip
      }
    }
    return flows;
  } catch {
    return []; // flows/ directory may not exist
  }
}
```

**KEY BEHAVIOR:**
- A directory is a node if and only if it contains `node.yaml`
- `aspects/`, `flows/`, `.briefs/`, and dot-directories are skipped
- Parent-child is determined by directory nesting
- Artifacts are ALL files in a node's directory except `node.yaml` and subdirectories
- The graph is a flat Map<string, GraphNode> for O(1) lookup, plus parent/children links for hierarchy traversal

---

## Step 5: Write unit tests

### `tests/unit/io/config-parser.test.ts`

Test that:
- Valid config.yaml parses correctly
- Missing `name` throws error
- Empty `tags` defaults to empty object
- `limits.context_warning_tokens` is parsed when present

### `tests/unit/io/node-parser.test.ts`

Test that:
- Valid node.yaml parses correctly
- Missing `name` or `type` throws error
- `mapping.path` as string works
- `mapping.path` as array works
- `blackbox` defaults to false
- Missing optional fields (tags, relations, mapping) default correctly

### `tests/unit/io/artifact-reader.test.ts`

Test that:
- Reads all .md files from a directory
- Excludes node.yaml
- Excludes binary files (.png, .jpg)
- Excludes subdirectories
- Returns sorted by filename

### `tests/unit/core/graph-loader.test.ts`

Test against a fixture in `tests/fixtures/sample-project/`. The fixture should contain:

```
tests/fixtures/sample-project/
  yggdrasil/
    config.yaml
    aspects/
      audit-logging.yaml
    flows/
      checkout-flow/
        flow.yaml
        sequence.md
    auth/
      node.yaml           # type: module, tags: [requires-audit]
      overview.md
      login-service/
        node.yaml          # type: service, relations: [→ users/user-repo]
        description.md
      auth-api/
        node.yaml          # type: interface, tags: [public-api]
        openapi.yaml
    orders/
      node.yaml            # type: module
      description.md
      business-rules.md
      order-service/
        node.yaml          # type: service, relations: [→ auth/auth-api]
        description.md
        state-machine.md
    users/
      node.yaml            # type: module
      user-repo/
        node.yaml          # type: service
        description.md
```

Test that:
- Graph has correct number of nodes
- Parent-child relationships are correct
- Aspects are loaded
- Flows are loaded
- Node artifacts are correct
- Top-level nodes have parent = null
- Child nodes have correct parent reference

---

## Verification

```bash
cd source/cli
npm run build
npm run typecheck
npm test
```

## Acceptance Criteria

- [ ] `src/model/types.ts` contains all types listed above
- [ ] All 6 parsers exist and work (config, node, aspect, flow, artifact, drift-state)
- [ ] `src/utils/` has paths.ts, hash.ts, tokens.ts
- [ ] `src/core/graph-loader.ts` recursively loads a graph from disk
- [ ] Test fixture exists in `tests/fixtures/sample-project/`
- [ ] Unit tests pass for parsers and graph-loader
- [ ] `npm run typecheck` passes
- [ ] `npm run build` produces valid dist/
