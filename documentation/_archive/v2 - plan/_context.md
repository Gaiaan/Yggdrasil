# Yggdrasil — Implementation Context

This file contains all decisions, architectural choices, and references needed by the implementing agent. Read this file FIRST before starting any phase.

---

## What Is Yggdrasil

Yggdrasil is a **CLI toolset for graph-driven software development**. It introduces a formal graph layer (directories with YAML metadata and markdown artifacts) between human intent and generated code. AI agents receive precise, bounded context packages instead of searching through entire codebases.

The CLI (`ygg`) is a pure mechanical tool — no AI, no API keys. It reads graph files, builds context, resolves dependencies, validates consistency, detects drift. AI agents (Cursor, Claude Code, Gemini CLI, etc.) do the actual code generation, instructed by agent command files (`/ygg.*`).

---

## Key Decisions

| Decision | Value |
|----------|-------|
| **npm package name** | `@gaiaan/yggdrasil-cli` |
| **CLI binary name** | `ygg` |
| **Source location** | `source/cli/` |
| **Runtime** | Node.js 22+ |
| **Language** | TypeScript 5.x, strict mode, ESM |
| **CLI framework** | Commander.js |
| **YAML parser** | `yaml` (YAML 1.2) |
| **Token estimation** | `js-tiktoken` |
| **Terminal colors** | `chalk` |
| **Test framework** | Vitest |
| **Bundler** | tsup (esbuild-based) |
| **Linter** | ESLint (flat config) + Prettier |
| **Docs site** | VitePress |
| **License** | MIT |
| **Agents in v0.1.0** | Claude Code, Cursor, GitHub Copilot, Gemini CLI |
| **Existing repo dirs** | Keep as-is (documentation/v0-v1.1.1, _baseline/, issues/, specifications/) |

---

## Repository Structure (target state)

```
Yggdrasil/
  # ── Open-source infrastructure ──
  README.md
  LICENSE
  CONTRIBUTING.md
  CODE_OF_CONDUCT.md
  SECURITY.md
  SUPPORT.md
  CHANGELOG.md
  AGENTS.md
  .markdownlint-cli2.jsonc

  # ── Repo config (existing, to update) ──
  .editorconfig
  .gitignore
  .gitattributes
  Yggdrasil.code-workspace

  # ── DevContainer (existing, to update) ──
  .devcontainer/
    devcontainer.json
    Dockerfile
    post-attach.sh

  # ── GitHub Actions (new) ──
  .github/
    workflows/
      ci.yml
      release.yml
      docs.yml
    CODEOWNERS
    ISSUE_TEMPLATE/
      bug_report.md
      feature_request.md
    pull_request_template.md

  # ── CLI package ──
  source/cli/
    package.json
    tsconfig.json
    tsup.config.ts
    vitest.config.ts
    eslint.config.js
    .prettierrc
    README.md
    src/
      bin.ts
      cli/
        init.ts
        build-context.ts
        resolve-deps.ts
        check.ts
        drift.ts
        status.ts
        affected.ts
        tree.ts
      core/
        graph-loader.ts
        context-builder.ts
        dependency-resolver.ts
        validator.ts
        drift-detector.ts
      io/
        config-parser.ts
        node-parser.ts
        aspect-parser.ts
        flow-parser.ts
        artifact-reader.ts
        drift-state-store.ts
      model/
        types.ts
      formatters/
        markdown.ts
        json.ts
        text.ts
      templates/
        commands/
          ygg-brief.md
          ygg-clarify.md
          ygg-plan.md
          ygg-apply.md
          ygg-check.md
          ygg-materialize.md
          ygg-drift.md
          ygg-define.md
          ygg-ingest.md
        adapters/
          claude.ts
          cursor.ts
          copilot.ts
          gemini.ts
      utils/
        tokens.ts
        hash.ts
        paths.ts
    tests/
      unit/
      integration/
      e2e/
      fixtures/
        sample-project/
          yggdrasil/
          src/

  # ── User documentation site ──
  docs/
    .vitepress/
      config.ts
    index.md
    getting-started.md
    installation.md
    concepts.md
    graph-guide.md
    cli-reference.md
    agent-commands.md
    workflow.md
    adoption-guide.md
    faq.md

  # ── Existing (keep as-is) ──
  documentation/          # Spec versions (v0, v1, v1.1, v1.1.1, v2)
  _baseline/              # spec-kit reference
  issues/                 # Empty
  specifications/         # Empty
  tools/                  # Empty
```

---

## Specification Documents Reference

All specification documents are in `documentation/v2/`. When a phase file references a spec section, use these paths:

| Document | Path | Key Content |
|----------|------|-------------|
| Vision | `documentation/v2/01-vision.md` | Why Yggdrasil exists, value proposition |
| Core Concepts | `documentation/v2/02-core-concepts.md` | Two worlds (Graph/Code), glossary, 8 principles |
| Graph Structure | `documentation/v2/03-graph-structure.md` | Directory hierarchy, `node.yaml` schema, `config.yaml`, aspects, flows |
| Context Builder | `documentation/v2/04-context-builder.md` | 6-layer assembly, output format, context budget |
| Workflow | `documentation/v2/05-workflow.md` | Pipeline: brief → clarify → plan → check → apply → materialize → drift |
| CLI Reference | `documentation/v2/06-cli-reference.md` | All `ygg` commands with usage, options, output, exit codes |
| Agent Commands | `documentation/v2/07-agent-commands.md` | All `/ygg.*` commands with full markdown content |
| Materialization | `documentation/v2/08-materialization.md` | How code is generated, dependency ordering, feedback loop |
| Drift Detection | `documentation/v2/09-drift-detection.md` | Hash comparison, .drift-state, absorb/reject |
| Adoption | `documentation/v2/10-adoption.md` | Greenfield, brownfield, incremental adoption |

---

## Implementation Order

Phases MUST be executed in order. Each phase has a verification step — do not proceed until it passes.

```
Phase 00: Repo infrastructure     (no code dependencies)
Phase 01: CLI project setup       (depends on: phase 00)
Phase 02: Data model + parsers    (depends on: phase 01)
Phase 03: ContextBuilder          (depends on: phase 02)
Phase 04: DependencyResolver      (depends on: phase 02)
Phase 05: Validator               (depends on: phase 03)
Phase 06: DriftDetector           (depends on: phase 02)
Phase 07: CLI commands            (depends on: phases 03-06)
Phase 08: Agent command prompts   (depends on: phase 07)
Phase 09: Docs site               (depends on: phase 07)
Phase 10: Tests                   (depends on: phases 07-08)
Phase 11: Packaging + release     (depends on: phase 10)
```

Phases 03, 04, 06 can be done in parallel after phase 02.
Phase 09 can be done in parallel with phase 08.

---

## Code Patterns

### Commander.js command registration

Every CLI command follows this pattern:

```typescript
// src/cli/example.ts
import { Command } from 'commander';
import { loadGraph } from '../core/graph-loader.js';

export function registerExampleCommand(program: Command): void {
  program
    .command('example <node-path>')
    .description('Short description')
    .option('--format <format>', 'Output format', 'text')
    .action(async (nodePath: string, options: { format: string }) => {
      try {
        const graph = await loadGraph(process.cwd());
        // ... command logic ...
        process.stdout.write(output);
      } catch (error) {
        process.stderr.write(`Error: ${(error as Error).message}\n`);
        process.exit(1);
      }
    });
}
```

### bin.ts entry point

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

### Parser pattern

Every parser is a pure function: file path in → typed data out.

```typescript
// src/io/node-parser.ts
import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import type { NodeMeta } from '../model/types.js';

export async function parseNodeYaml(filePath: string): Promise<NodeMeta> {
  const content = await readFile(filePath, 'utf-8');
  const raw = parseYaml(content);
  // validate required fields, normalize mapping.path to array
  return normalized;
}
```

### GraphLoader pattern

```typescript
// src/core/graph-loader.ts
export async function loadGraph(projectRoot: string): Promise<Graph> {
  const yggRoot = path.join(projectRoot, 'yggdrasil');
  const config = await parseConfig(path.join(yggRoot, 'config.yaml'));
  const nodes = await scanNodes(yggRoot);     // recursive directory walk
  const aspects = await loadAspects(yggRoot);  // read aspects/ dir
  const flows = await loadFlows(yggRoot);      // read flows/ dir
  return { config, nodes, aspects, flows, rootPath: yggRoot };
}
```

---

## Naming Conventions

- **Files:** kebab-case (`graph-loader.ts`, `node-parser.ts`)
- **Types/Interfaces:** PascalCase (`GraphNode`, `NodeMeta`, `YggConfig`)
- **Functions:** camelCase (`loadGraph`, `parseNodeYaml`, `buildContext`)
- **CLI commands:** kebab-case (`build-context`, `resolve-deps`)
- **Agent commands:** dot-separated (`/ygg.brief`, `/ygg.materialize`)
- **Template files:** kebab-case with `ygg-` prefix (`ygg-brief.md`, `ygg-materialize.md`)

---

## Important Rules

1. **All CLI commands are deterministic.** Same input → same output. No randomness.
2. **All output goes to stdout.** Errors go to stderr. Composable with pipes.
3. **JSON output available on every command** via `--format json`.
4. **No command modifies graph files** (except `init` which creates them and `drift --absorb` which updates `.drift-state`).
5. **The CLI never calls any AI.** No API keys, no network calls.
6. **Fast.** All operations are local file reads + computation. Target: milliseconds for typical graphs.
7. **Exit codes are meaningful.** 0 = success. Non-zero = specific error (see each command's spec).
