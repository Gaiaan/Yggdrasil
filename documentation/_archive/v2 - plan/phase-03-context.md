# Phase 03 — ContextBuilder (build-context)

## Goal

Implement the 6-layer context assembly engine and the `ygg build-context` CLI command. This is the core value component of Yggdrasil.

## Prerequisites

- Phase 02 complete (types, parsers, GraphLoader work)

## Spec References

- 6-layer assembly: `documentation/v2/04-context-builder.md` lines 12-81
- Output format: `documentation/v2/04-context-builder.md` lines 84-174
- Context budget: `documentation/v2/04-context-builder.md` lines 220-234
- CLI command: `documentation/v2/06-cli-reference.md` lines 55-106
- Tag propagation: `documentation/v2/03-graph-structure.md` lines 258-260

---

## Step 1: Create `src/core/context-builder.ts`

### Pseudocode

```
function buildContext(graph, nodePath):
  node = graph.nodes.get(nodePath)
  if not node: throw "Node not found"

  layers = []

  // Layer 1: Global
  layers.push(buildGlobalLayer(graph.config))

  // Layer 2: Hierarchy
  ancestors = collectAncestors(node)  // walk parent links up to root
  for each ancestor (from root to direct parent):
    layers.push(buildHierarchyLayer(ancestor))

  // Layer 3: Own
  layers.push(buildOwnLayer(node))

  // Layer 4: Relational
  if node.meta.relations:
    for each relation in node.meta.relations:
      relatedNode = graph.nodes.get(relation.target)
      if not relatedNode: throw "Broken relation"
      layers.push(buildRelationalLayer(relatedNode, relation.type))

  // Layer 5: Aspects
  effectiveTags = resolveEffectiveTags(node, graph.config)
  for each tag in effectiveTags:
    matchingAspects = graph.aspects.filter(a => a.tag === tag)
    for each aspect in matchingAspects:
      layers.push(buildAspectLayer(aspect))

  // Layer 6: Flows
  for each flow in graph.flows:
    if nodePath in flow.nodes:
      layers.push(buildFlowLayer(flow))

  // Compute token count
  fullText = layers.map(l => l.content).join('\n')
  tokenCount = estimateTokens(fullText)

  // Warn if over budget
  threshold = graph.config.limits?.context_warning_tokens ?? 8000
  if tokenCount > threshold:
    stderr.write(warning)

  return { nodePath, nodeName: node.meta.name, layers, mapping, tokenCount }
```

### Tag Propagation Logic

```typescript
function resolveEffectiveTags(node: GraphNode, config: YggConfig): string[] {
  const tags = new Set<string>(node.meta.tags ?? []);

  // Walk up parent chain, collecting propagating tags
  let current = node.parent;
  while (current) {
    for (const tag of current.meta.tags ?? []) {
      const tagDef = config.tags[tag];
      if (tagDef?.propagates) {
        tags.add(tag);
      }
    }
    current = current.parent;
  }

  return [...tags];
}
```

**KEY RULES:**
- Hierarchy layer: collect ancestors from ROOT to direct parent (not the other way)
- Relational layer: ONLY direct relations — do NOT follow transitive relations
- Aspect layer: aspects apply if the NODE has the tag (not if a related node has it)
- Tag propagation: ONLY along parent-child axis (not via relations)
- Flow layer: include flow ARTIFACTS only, NOT other participating nodes' artifacts
- All artifacts included VERBATIM — no summarization

### Full implementation structure

```typescript
import type {
  Graph, GraphNode, ContextPackage, ContextLayer, YggConfig
} from '../model/types.js';
import { normalizeMappingPaths } from '../utils/paths.js';
import { estimateTokens } from '../utils/tokens.js';

export async function buildContext(
  graph: Graph,
  nodePath: string,
): Promise<ContextPackage> {
  const node = graph.nodes.get(nodePath);
  if (!node) {
    throw new Error(`Node not found: ${nodePath}`);
  }

  const layers: ContextLayer[] = [];

  // Layer 1: Global
  layers.push(buildGlobalLayer(graph.config));

  // Layer 2: Hierarchy
  const ancestors = collectAncestors(node);
  for (const ancestor of ancestors) {
    layers.push(buildHierarchyLayer(ancestor));
  }

  // Layer 3: Own
  layers.push(buildOwnLayer(node));

  // Layer 4: Relational
  for (const relation of node.meta.relations ?? []) {
    const target = graph.nodes.get(relation.target);
    if (!target) {
      throw new Error(
        `Broken relation: ${nodePath} -> ${relation.target} (target not found)`
      );
    }
    layers.push(buildRelationalLayer(target, relation.type));
  }

  // Layer 5: Aspects
  const effectiveTags = resolveEffectiveTags(node, graph.config);
  for (const tag of effectiveTags) {
    for (const aspect of graph.aspects) {
      if (aspect.tag === tag) {
        layers.push(buildAspectLayer(aspect));
      }
    }
  }

  // Layer 6: Flows
  for (const flow of graph.flows) {
    if (flow.nodes.includes(nodePath)) {
      layers.push(buildFlowLayer(flow));
    }
  }

  const fullText = layers.map(l => l.content).join('\n\n');
  const tokenCount = await estimateTokens(fullText);
  const mapping = normalizeMappingPaths(node.meta.mapping);

  return {
    nodePath,
    nodeName: node.meta.name,
    layers,
    mapping: mapping.length > 0 ? mapping : null,
    tokenCount,
  };
}

// --- Layer builders ---

function buildGlobalLayer(config: YggConfig): ContextLayer {
  let content = `**Project:** ${config.name}\n\n`;
  content += `**Stack:**\n`;
  for (const [key, value] of Object.entries(config.stack)) {
    content += `- ${key}: ${value}\n`;
  }
  content += `\n**Standards:**\n`;
  for (const [key, value] of Object.entries(config.standards)) {
    content += `${value}\n`;
  }
  return { type: 'global', label: 'Global Context', content };
}

function buildHierarchyLayer(ancestor: GraphNode): ContextLayer {
  const content = ancestor.artifacts
    .map(a => `### ${a.filename}\n${a.content}`)
    .join('\n\n');
  return {
    type: 'hierarchy',
    label: `Module Context (${ancestor.path}/)`,
    content,
  };
}

function buildOwnLayer(node: GraphNode): ContextLayer {
  const content = node.artifacts
    .map(a => `### ${a.filename}\n${a.content}`)
    .join('\n\n');
  return {
    type: 'own',
    label: `Node: ${node.meta.name}`,
    content,
  };
}

function buildRelationalLayer(target: GraphNode, relationType: string): ContextLayer {
  const content = target.artifacts
    .map(a => `#### ${a.filename}\n${a.content}`)
    .join('\n\n');
  return {
    type: 'relational',
    label: `${target.path} (${relationType})`,
    content,
  };
}

function buildAspectLayer(aspect: { name: string; tag: string; rawContent: string }): ContextLayer {
  return {
    type: 'aspects',
    label: `${aspect.name} (tag: ${aspect.tag})`,
    content: aspect.rawContent,
  };
}

function buildFlowLayer(flow: { name: string; artifacts: { filename: string; content: string }[] }): ContextLayer {
  const content = flow.artifacts
    .map(a => `### ${a.filename}\n${a.content}`)
    .join('\n\n');
  return {
    type: 'flows',
    label: flow.name,
    content,
  };
}

// --- Helpers ---

function collectAncestors(node: GraphNode): GraphNode[] {
  const ancestors: GraphNode[] = [];
  let current = node.parent;
  while (current) {
    ancestors.unshift(current); // root first
    current = current.parent;
  }
  return ancestors;
}

function resolveEffectiveTags(node: GraphNode, config: YggConfig): string[] {
  const tags = new Set<string>(node.meta.tags ?? []);
  let current = node.parent;
  while (current) {
    for (const tag of current.meta.tags ?? []) {
      if (config.tags[tag]?.propagates) {
        tags.add(tag);
      }
    }
    current = current.parent;
  }
  return [...tags];
}
```

---

## Step 2: Create `src/formatters/markdown.ts`

Formats a ContextPackage into the markdown document specified in `04-context-builder.md`.

```typescript
import type { ContextPackage } from '../model/types.js';

export function formatContextMarkdown(pkg: ContextPackage): string {
  let md = '';

  md += `# Context Package: ${pkg.nodeName}\n`;
  md += `# Path: ${pkg.nodePath}\n`;
  md += `# Generated: ${new Date().toISOString()}\n\n`;
  md += `---\n\n`;

  for (const layer of pkg.layers) {
    md += `## ${layer.label}\n\n`;
    md += layer.content;
    md += `\n\n---\n\n`;
  }

  if (pkg.mapping) {
    md += `## Materialization Target\n\n`;
    md += `**Mapping:** ${pkg.mapping.join(', ')}\n\n`;
    md += `---\n\n`;
  }

  // Footer
  md += `Context size: ${pkg.tokenCount.toLocaleString()} tokens\n`;
  md += `Layers: ${pkg.layers.map(l => l.type).join(', ')}\n`;

  return md;
}
```

---

## Step 3: Create `src/formatters/json.ts`

```typescript
import type { ContextPackage } from '../model/types.js';

export function formatContextJson(pkg: ContextPackage): string {
  return JSON.stringify({
    nodePath: pkg.nodePath,
    nodeName: pkg.nodeName,
    generatedAt: new Date().toISOString(),
    layers: pkg.layers.map(l => ({
      type: l.type,
      label: l.label,
      content: l.content,
    })),
    mapping: pkg.mapping,
    tokenCount: pkg.tokenCount,
  }, null, 2);
}
```

---

## Step 4: Create CLI command `src/cli/build-context.ts`

```typescript
import { Command } from 'commander';
import { loadGraph } from '../core/graph-loader.js';
import { buildContext } from '../core/context-builder.js';
import { formatContextMarkdown } from '../formatters/markdown.js';
import { formatContextJson } from '../formatters/json.js';

export function registerBuildContextCommand(program: Command): void {
  program
    .command('build-context <node-path>')
    .description('Build a complete context package for a node')
    .option('--format <format>', 'Output format: markdown or json', 'markdown')
    .action(async (nodePath: string, options: { format: string }) => {
      try {
        const graph = await loadGraph(process.cwd());
        const pkg = await buildContext(graph, nodePath);

        const output = options.format === 'json'
          ? formatContextJson(pkg)
          : formatContextMarkdown(pkg);

        process.stdout.write(output);
      } catch (error) {
        const msg = (error as Error).message;
        process.stderr.write(`Error: ${msg}\n`);

        if (msg.includes('not found')) process.exit(1);
        if (msg.includes('Broken relation')) process.exit(2);
        process.exit(1);
      }
    });
}
```

Register in `bin.ts`:
```typescript
import { registerBuildContextCommand } from './cli/build-context.js';
// ... in setup:
registerBuildContextCommand(program);
```

---

## Step 5: Tests

### What to test

1. **buildGlobalLayer** — produces correct markdown from config
2. **collectAncestors** — returns ancestors in root-to-parent order
3. **resolveEffectiveTags** — includes own tags + propagated parent tags
4. **resolveEffectiveTags** — does NOT include non-propagating parent tags
5. **buildContext full** — uses fixture, verifies all 6 layers present
6. **buildContext** — broken relation throws with exit code 2
7. **buildContext** — node not found throws with exit code 1
8. **buildContext** — token count is computed and returned
9. **formatContextMarkdown** — snapshot test on fixture output
10. **formatContextJson** — snapshot test on fixture output

Use the same fixture from Phase 02 (`tests/fixtures/sample-project/`).

---

## Verification

```bash
cd source/cli
npm run build
npm test

# Manual test against fixture:
cd tests/fixtures/sample-project
node ../../../dist/bin.js build-context orders/order-service
```

## Acceptance Criteria

- [ ] `buildContext()` assembles all 6 layers correctly
- [ ] Tag propagation works (parent propagating tag appears on children)
- [ ] Non-propagating tags do NOT propagate
- [ ] Relational layer includes ONLY direct relations (not transitive)
- [ ] Flow layer includes flow artifacts when node is a participant
- [ ] Token count is computed and reported in footer
- [ ] Warning to stderr when context exceeds threshold
- [ ] `ygg build-context <path>` outputs markdown to stdout
- [ ] `ygg build-context <path> --format json` outputs JSON
- [ ] Exit code 1 for missing node, 2 for broken relation
- [ ] Tests pass
