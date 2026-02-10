# Phase 07 — CLI Helper Commands (init, status, affected, tree)

## Goal

Implement the remaining CLI commands: `init` (graph scaffolding + agent command installation), `status` (graph summary), `affected` (reverse dependency lookup), `tree` (visual tree output).

## Prerequisites

- Phases 03-06 complete (all core modules available)

## Spec References

- init: `documentation/v2/06-cli-reference.md` lines 21-52
- status: `documentation/v2/06-cli-reference.md` lines 288-318
- affected: `documentation/v2/06-cli-reference.md` lines 320-365
- tree: `documentation/v2/06-cli-reference.md` lines 367-406

---

## Step 1: `ygg init` — `src/cli/init.ts`

This command creates the yggdrasil/ directory structure and copies agent command templates.

```typescript
import { Command } from 'commander';
import { mkdir, writeFile, cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AGENTS: Record<string, { dir: string; format: 'md' | 'toml' }> = {
  claude:  { dir: '.claude/commands',  format: 'md' },
  cursor:  { dir: '.cursor/commands',  format: 'md' },
  copilot: { dir: '.github/agents',    format: 'md' },
  gemini:  { dir: '.gemini/commands',  format: 'toml' },
};

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize Yggdrasil graph in current project')
    .option('--agent <name>', 'Target agent: claude, cursor, copilot, gemini')
    .action(async (options) => {
      const projectRoot = process.cwd();
      const yggRoot = path.join(projectRoot, 'yggdrasil');

      // 1. Create directory structure
      await mkdir(path.join(yggRoot, 'aspects'), { recursive: true });
      await mkdir(path.join(yggRoot, 'flows'), { recursive: true });
      await mkdir(path.join(yggRoot, '.briefs'), { recursive: true });

      // 2. Create skeleton config.yaml
      const configContent = `name: "My Project"

stack:
  language: ""
  runtime: ""
  framework: ""

standards:
  coding: ""
  testing: ""

limits:
  context_warning_tokens: 8000

tags: {}
`;
      await writeFile(path.join(yggRoot, 'config.yaml'), configContent);

      // 3. Copy agent command templates
      const agentName = options.agent;
      if (agentName) {
        const agentConfig = AGENTS[agentName];
        if (!agentConfig) {
          process.stderr.write(`Unknown agent: ${agentName}. Use: ${Object.keys(AGENTS).join(', ')}\n`);
          process.exit(1);
        }
        await installAgentCommands(projectRoot, agentName, agentConfig);
      } else {
        // If no --agent flag, list available agents
        process.stdout.write('No --agent specified. Available agents:\n');
        for (const [name, config] of Object.entries(AGENTS)) {
          process.stdout.write(`  --agent ${name}  →  ${config.dir}/\n`);
        }
        process.stdout.write('\nRun: ygg init --agent <name>\n');
      }

      // 4. Print next steps
      process.stdout.write('\n✓ Yggdrasil initialized.\n\n');
      process.stdout.write('Next steps:\n');
      process.stdout.write('  1. Edit yggdrasil/config.yaml — set your project name and tech stack\n');
      process.stdout.write('  2. Create your first node: mkdir yggdrasil/my-module && create node.yaml\n');
      process.stdout.write('  3. Run: ygg check\n');
    });
}

async function installAgentCommands(
  projectRoot: string,
  agentName: string,
  config: { dir: string; format: 'md' | 'toml' },
): Promise<void> {
  const targetDir = path.join(projectRoot, config.dir);
  await mkdir(targetDir, { recursive: true });

  // Find templates directory (relative to this file's location in dist/)
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const templatesDir = path.join(__dirname, 'templates', 'commands');

  // Use the appropriate adapter to copy/convert commands
  // For md agents: copy .md files directly
  // For gemini: convert .md to .toml via adapter

  if (config.format === 'md') {
    // Copy all ygg-*.md files to target directory
    // Implementation: read templates dir, copy each file
  } else if (config.format === 'toml') {
    // Convert each .md to .toml using gemini adapter
  }

  process.stdout.write(`✓ Agent commands installed to ${config.dir}/\n`);
}
```

**NOTE:** The template copying logic depends on Phase 08 (agent command prompts). For now, create the scaffolding. The actual template files will be created in Phase 08 and wired in.

---

## Step 2: `ygg status` — `src/cli/status.ts`

```typescript
import { Command } from 'commander';
import { loadGraph } from '../core/graph-loader.js';
import { detectDrift } from '../core/drift-detector.js';
import chalk from 'chalk';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Show graph summary')
    .action(async () => {
      try {
        const graph = await loadGraph(process.cwd());

        // Count nodes by type
        const typeCounts = new Map<string, number>();
        let mappedCount = 0;
        let blackboxCount = 0;

        for (const node of graph.nodes.values()) {
          typeCounts.set(node.meta.type, (typeCounts.get(node.meta.type) ?? 0) + 1);
          if (node.meta.mapping) mappedCount++;
          if (node.meta.blackbox) blackboxCount++;
        }

        // Count relations
        let relationCount = 0;
        for (const node of graph.nodes.values()) {
          relationCount += (node.meta.relations?.length ?? 0);
        }

        // Count tags in use
        const usedTags = new Set<string>();
        for (const node of graph.nodes.values()) {
          for (const tag of node.meta.tags ?? []) usedTags.add(tag);
        }

        // Output
        process.stdout.write(`Graph: ${graph.config.name}\n`);
        const stackEntries = Object.entries(graph.config.stack);
        if (stackEntries.length > 0) {
          process.stdout.write(`Stack: ${stackEntries.map(([k,v]) => v).join(' / ')}\n`);
        }
        process.stdout.write('\n');

        const typeStr = [...typeCounts.entries()]
          .map(([t, c]) => `${c} ${t}s`)
          .join(', ');
        process.stdout.write(`Nodes:      ${graph.nodes.size} total (${typeStr})\n`);
        if (blackboxCount > 0) {
          process.stdout.write(`            ${blackboxCount} blackbox\n`);
        }
        process.stdout.write(`Tags:       ${Object.keys(graph.config.tags).length} defined, ${usedTags.size} in use\n`);
        process.stdout.write(`Aspects:    ${graph.aspects.length} defined\n`);
        process.stdout.write(`Flows:      ${graph.flows.length} defined\n`);
        process.stdout.write(`Relations:  ${relationCount} total\n`);
        process.stdout.write(`Mappings:   ${mappedCount} nodes mapped to code\n`);

        // Drift summary
        const drift = await detectDrift(graph);
        const okCount = drift.entries.filter(e => e.status === 'ok').length;
        const driftCount = drift.driftCount;
        const unmaterialized = drift.entries.filter(e => e.status === 'unmaterialized').length;
        process.stdout.write('\nDrift:\n');
        if (okCount > 0) process.stdout.write(chalk.green(`  ✓ ${okCount} up to date\n`));
        if (driftCount > 0) process.stdout.write(chalk.red(`  ✗ ${driftCount} nodes have drift\n`));
        if (unmaterialized > 0) process.stdout.write(chalk.dim(`  - ${unmaterialized} unmaterialized\n`));

      } catch (error) {
        process.stderr.write(`Error: ${(error as Error).message}\n`);
        process.exit(1);
      }
    });
}
```

---

## Step 3: `ygg affected` — `src/cli/affected.ts`

```typescript
import { Command } from 'commander';
import { loadGraph } from '../core/graph-loader.js';

export function registerAffectedCommand(program: Command): void {
  program
    .command('affected <node-path>')
    .description('Show nodes and flows that depend on a given node')
    .option('--format <format>', 'Output format: text or json', 'text')
    .action(async (nodePath: string, options) => {
      try {
        const graph = await loadGraph(process.cwd());

        if (!graph.nodes.has(nodePath)) {
          process.stderr.write(`Node not found: ${nodePath}\n`);
          process.exit(1);
        }

        // Find nodes that have a relation TO this node
        const dependents: { path: string; relationType: string }[] = [];
        for (const [path, node] of graph.nodes) {
          for (const rel of node.meta.relations ?? []) {
            if (rel.target === nodePath) {
              dependents.push({ path, relationType: rel.type });
            }
          }
        }

        // Find flows that include this node
        const flows = graph.flows.filter(f => f.nodes.includes(nodePath));

        if (options.format === 'json') {
          process.stdout.write(JSON.stringify({ dependents, flows: flows.map(f => f.name) }, null, 2));
        } else {
          if (dependents.length > 0) {
            process.stdout.write(`Nodes depending on ${nodePath} (via relations):\n`);
            for (const d of dependents) {
              process.stdout.write(`  - ${d.path} (${d.relationType})\n`);
            }
          }
          if (flows.length > 0) {
            process.stdout.write(`\nFlows involving ${nodePath}:\n`);
            for (const f of flows) {
              process.stdout.write(`  - ${f.name}\n`);
            }
          }
          process.stdout.write(`\n${dependents.length} dependent nodes, ${flows.length} flows.\n`);
        }
      } catch (error) {
        process.stderr.write(`Error: ${(error as Error).message}\n`);
        process.exit(1);
      }
    });
}
```

---

## Step 4: `ygg tree` — `src/cli/tree.ts`

```typescript
import { Command } from 'commander';
import { loadGraph } from '../core/graph-loader.js';
import type { GraphNode } from '../model/types.js';
import chalk from 'chalk';

export function registerTreeCommand(program: Command): void {
  program
    .command('tree')
    .description('Display graph as a tree')
    .option('--depth <n>', 'Maximum depth', parseInt)
    .option('--no-tags', 'Hide tags')
    .action(async (options) => {
      try {
        const graph = await loadGraph(process.cwd());

        process.stdout.write(`${graph.config.name}\n`);

        // Get top-level nodes (no parent)
        const topLevel = [...graph.nodes.values()]
          .filter(n => n.parent === null)
          .sort((a, b) => a.path.localeCompare(b.path));

        for (let i = 0; i < topLevel.length; i++) {
          const isLast = i === topLevel.length - 1;
          printNode(topLevel[i], '', isLast, 1, options.depth, options.tags !== false);
        }
      } catch (error) {
        process.stderr.write(`Error: ${(error as Error).message}\n`);
        process.exit(1);
      }
    });
}

function printNode(
  node: GraphNode,
  prefix: string,
  isLast: boolean,
  depth: number,
  maxDepth: number | undefined,
  showTags: boolean,
): void {
  const connector = isLast ? '└── ' : '├── ';
  const name = node.path.split('/').pop();
  const type = `(${node.meta.type})`;
  const tags = showTags && node.meta.tags?.length
    ? chalk.dim(` [${node.meta.tags.join(', ')}]`)
    : '';
  const blackbox = node.meta.blackbox ? chalk.dim(' [blackbox]') : '';

  process.stdout.write(`${prefix}${connector}${name}/ ${type}${tags}${blackbox}\n`);

  // Print metadata line
  const childPrefix = prefix + (isLast ? '    ' : '│   ');
  const artifactCount = node.artifacts.length;
  const mapping = node.meta.mapping
    ? Array.isArray(node.meta.mapping.path)
      ? node.meta.mapping.path.join(', ')
      : node.meta.mapping.path
    : null;
  const meta = `${artifactCount} artifacts${mapping ? `, mapping: ${mapping}` : ''}`;
  process.stdout.write(`${childPrefix}└── ${chalk.dim(meta)}\n`);

  // Recurse into children
  if (maxDepth !== undefined && depth >= maxDepth) return;

  const children = node.children.sort((a, b) => a.path.localeCompare(b.path));
  for (let i = 0; i < children.length; i++) {
    printNode(
      children[i],
      childPrefix,
      i === children.length - 1,
      depth + 1,
      maxDepth,
      showTags,
    );
  }
}
```

---

## Step 5: Register all commands in `bin.ts`

Update `src/bin.ts` to import and register all commands:

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { registerInitCommand } from './cli/init.js';
import { registerBuildContextCommand } from './cli/build-context.js';
import { registerResolveDepsCommand } from './cli/resolve-deps.js';
import { registerCheckCommand } from './cli/check.js';
import { registerDriftCommand } from './cli/drift.js';
import { registerStatusCommand } from './cli/status.js';
import { registerAffectedCommand } from './cli/affected.js';
import { registerTreeCommand } from './cli/tree.js';

const program = new Command();
program
  .name('ygg')
  .description('Yggdrasil — Graph-Driven Software Development CLI')
  .version('0.1.0');

registerInitCommand(program);
registerBuildContextCommand(program);
registerResolveDepsCommand(program);
registerCheckCommand(program);
registerDriftCommand(program);
registerStatusCommand(program);
registerAffectedCommand(program);
registerTreeCommand(program);

program.parse();
```

---

## Verification

```bash
cd source/cli
npm run build

# Test against fixture
cd tests/fixtures/sample-project
node ../../../dist/bin.js tree
node ../../../dist/bin.js status
node ../../../dist/bin.js affected auth/auth-api
node ../../../dist/bin.js check

npm test
```

## Acceptance Criteria

- [ ] `ygg init` creates yggdrasil/ with config.yaml, aspects/, flows/, .briefs/
- [ ] `ygg init --agent cursor` copies command files to .cursor/commands/
- [ ] `ygg status` shows node counts, tags, aspects, relations, drift summary
- [ ] `ygg affected <path>` finds reverse dependencies and flows
- [ ] `ygg tree` renders tree with types, tags, artifact counts, mappings
- [ ] `ygg tree --depth 1` limits depth
- [ ] All commands handle errors gracefully (graph not found, node not found)
- [ ] All commands registered in bin.ts and `ygg --help` shows all of them
