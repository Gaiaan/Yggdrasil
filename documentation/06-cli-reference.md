# 06 — CLI Reference

## Overview

The `ygg` CLI is a **pure toolset** — it operates on files, performs mechanical computations, and produces output. It does not call any AI, requires no API keys, and makes no decisions. It is the foundation that agents and humans use to work with the graph.

**Installation:**

```bash
npm install -g @yggdrasil/cli
```

**Runtime:** Node.js 22+

**Language:** TypeScript

---

## Commands

### `ygg init`

Initialize a Yggdrasil graph in the current project.

**Usage:**

```bash
ygg init [--agent <agent>]
ygg init --agent cursor --commands-only   # Update commands only (no config overwrite)
```

**What it does:**

1. Creates `.yggdrasil/` directory with:
   - `config.yaml` — skeleton with project name and stack placeholders
   - `aspects/` — empty directory
   - `flows/` — empty directory
   - `.briefs/` — empty directory
2. Installs agent command files to the appropriate directory:
   - `--agent claude` → `.claude/commands/ygg-*.md`
   - `--agent cursor` → `.cursor/commands/ygg-*.md`
   - `--agent gemini` → `.gemini/commands/ygg-*.toml`
   - (no flag) → prompts for agent selection
3. Prints next steps.

**With `--commands-only`:** Only installs or updates agent commands. Does not touch `config.yaml` or create directories. Use when updating the CLI (e.g. after `npm update`) to refresh command templates without losing your config. Requires `--agent`.

**Options:**

| Option | Description |
|---|---|
| `--agent <name>` | Target agent: `claude`, `cursor`, `gemini`, `copilot` |
| `--commands-only` | Only update agent commands; do not touch config or directories |

**Output:** Files created on disk. Summary to stdout.

---

### `ygg build-context <node-path>`

Build a complete context package for a node.

**Usage:**

```bash
ygg build-context orders/order-service
ygg build-context auth/login-service --format markdown
ygg build-context auth/login-service --format json
```

**What it does:**

1. Resolves the node at `.yggdrasil/<node-path>/`
2. Reads `config.yaml` (global layer)
3. Walks up the directory hierarchy, collecting artifacts from each ancestor node (hierarchical layer)
4. Reads all artifacts from the node's own directory (own layer)
5. For each relation in `node.yaml`, reads artifacts from the target node (relational layer)
6. For each tag on the node (including propagated tags from ancestors), finds matching aspects (aspect layer)
7. Scans all `flow.yaml` files and includes artifacts from flows that list this node (flow layer)
8. Assembles everything into a single document

**Options:**

| Option | Default | Description |
|---|---|---|
| `--format` | `markdown` | Output format: `markdown` or `json` |

**Output:** Context package to stdout. Includes a metadata footer with size information:

```
---
Context size: 2,847 tokens
Layers: global, hierarchy (1), own (3 artifacts), relations (2), aspects (1), flows (1)
```

If the context exceeds `limits.context_warning_tokens` from `config.yaml`, a warning is printed to stderr:

```
⚠ Context for shop/checkout is 12,400 tokens (threshold: 8,000).
  Consider splitting the node or reducing relations.
```

**Exit codes:**

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Node not found (no `node.yaml` at path) |
| 2 | Relation target not found (broken relation) |

---

### `ygg resolve-deps`

Compute the dependency tree and materialization order for nodes.

**Usage:**

```bash
ygg resolve-deps
ygg resolve-deps --changed
ygg resolve-deps --node orders/order-service
ygg resolve-deps --format json
```

**What it does:**

1. Parses all `node.yaml` files in the graph
2. Excludes blackbox nodes (`blackbox: true`) — they are not materialized
3. Builds a dependency graph from `relations`
4. Performs topological sort to determine materialization order
5. Groups independent nodes into parallel stages

**Modes:**

| Mode | Description |
|---|---|
| (no flag) | All leaf nodes (nodes with `mapping`) |
| `--changed` | Only nodes whose graph files are newer than mapped code files |
| `--node <path>` | A specific node and its transitive dependencies |

**Options:**

| Option | Default | Description |
|---|---|---|
| `--format` | `text` | Output format: `text` or `json` |

**Output (text):**

```
Stage 1 (parallel):
  - auth/password-reset-email
  - notifications/email-service

Stage 2 (parallel):
  - auth/password-reset-service

Stage 3:
  - auth/auth-api
```

**Output (json):**

```json
{
  "stages": [
    {
      "stage": 1,
      "parallel": true,
      "nodes": ["auth/password-reset-email", "notifications/email-service"]
    },
    {
      "stage": 2,
      "parallel": true,
      "nodes": ["auth/password-reset-service"]
    },
    {
      "stage": 3,
      "parallel": false,
      "nodes": ["auth/auth-api"]
    }
  ]
}
```

**Exit codes:**

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Circular dependency detected |
| 2 | Broken relation (target not found) |

---

### `ygg check`

Validate the structural consistency of the graph.

**Usage:**

```bash
ygg check
ygg check --format json
```

**What it does:**

Runs all validation rules:

1. Every `relations[].target` points to an existing node
2. Every tag in `node.yaml` files is defined in `config.yaml`
3. Every aspect references a defined tag
4. No circular dependencies in relations
5. No duplicate `mapping.path` values across nodes
6. Every directory under `.yggdrasil/` (except reserved: `aspects/`, `.briefs/`, `flows/`) that contains files also contains `node.yaml`
7. Every node listed in a `flow.yaml` exists
8. No node carries two tags that are declared as `conflicts_with` each other in `config.yaml`
9. No non-blackbox node's context package exceeds `limits.context_warning_tokens` (soft warning, not a failure — blackbox nodes are excluded)

**Output (text):**

```
✓ 23 nodes scanned
✓ Relations: all targets valid
✗ Tags: 'requires-email' used in orders/notification-handler but not defined in config.yaml
✓ Aspects: all tags valid
✓ Dependencies: no cycles
✓ Mappings: no duplicates
✓ Flows: all participants valid
✗ Conflicts: node shop/widget has tags [server-only, client-interactive] which conflict
✗ Structure: directory '.yggdrasil/utils/' has files but no node.yaml
⚠ Context budget: shop/checkout context is 12,400 tokens (threshold: 8,000)

3 issues, 1 warning.
```

**Exit codes:**

| Code | Meaning |
|---|---|
| 0 | No issues |
| 1 | Issues found |

---

### `ygg drift`

Detect divergence between graph expectations and actual code.

**Usage:**

```bash
ygg drift
ygg drift --format json
ygg drift --node orders/order-service
```

**What it does:**

For each node with a `mapping` in `node.yaml`:

1. Check if the mapped file or directory exists
2. Compare the file's content hash against the last recorded hash (stored in `.yggdrasil/.drift-state`)
3. Report any differences

**Output (text):**

```
orders/order-service → src/modules/orders/order.service.ts
  ✗ DRIFT: file modified since last materialization (14 lines changed)

auth/login-service → src/modules/auth/login.service.ts
  ✓ OK: matches last materialization

auth/auth-api → src/modules/auth/auth.controller.ts
  ✗ MISSING: mapped file does not exist (not yet materialized?)

3 nodes checked. 1 drift detected, 1 missing.
```

**Exit codes:**

| Code | Meaning |
|---|---|
| 0 | No drift |
| 1 | Drift detected |
| 2 | Missing mapped files |

---

### `ygg status`

Show a summary of the graph state.

**Usage:**

```bash
ygg status
```

**Output:**

```
Graph: My E-Commerce System
Stack: TypeScript / NestJS / PostgreSQL

Nodes:      23 total (5 modules, 12 services, 4 interfaces, 2 models)
Tags:       4 defined, 3 in use
Aspects:    2 defined
Relations:  18 total
Mappings:   15 nodes mapped to code

Materialization:
  ✓ 12 up to date
  ✗ 2 need rematerialization (graph newer than code)
  - 1 unmapped (no mapping defined)

Drift:
  ✗ 1 node has code drift
```

---

### `ygg affected <node-path>`

Show all nodes and flows that depend on or involve a given node.

**Usage:**

```bash
ygg affected data/products/
ygg affected data/products/ --format json
```

**What it does:**

1. Scans all `node.yaml` files for `relations` targeting the given node
2. Scans all `flow.yaml` files for flows that list the given node
3. Reports both lists

**Output (text):**

```
Nodes depending on data/products/ (via relations):
  - shop/product-listing/ (reads)
  - shop/product-detail/ (reads)
  - admin/product-management/ (uses)
  - payments/stripe-webhooks/ (reads)

Flows involving data/products/:
  - checkout-flow

4 dependent nodes, 1 flow.
```

**Options:**

| Option | Default | Description |
|---|---|---|
| `--format` | `text` | Output format: `text` or `json` |

**Exit codes:**

| Code | Meaning |
|---|---|
| 0 | Results found (or no dependents — still success) |
| 1 | Node not found |

---

### `ygg tree`

Display the graph as a directory tree with metadata.

**Usage:**

```bash
ygg tree
ygg tree auth/
ygg tree --depth 2 --compact
ygg tree auth/ --depth 1
```

**Note on large graphs:** Running `ygg tree` without `--depth` on a large graph produces unbounded output. AI agents should use `--depth 1 --compact` first for an overview, then drill into specific subtrees with `ygg tree <path>/`. See the `/ygg.plan` command for the recommended progressive navigation pattern.

**Output:**

```
My E-Commerce System
├── auth/ (module) [requires-audit]
│   ├── login-service/ (service)
│   │   └── 3 artifacts, mapping: src/modules/auth/login.service.ts
│   ├── session-manager/ (service)
│   │   └── 2 artifacts, mapping: src/modules/auth/session.service.ts
│   └── auth-api/ (interface) [public-api]
│       └── 2 artifacts, mapping: src/modules/auth/auth.controller.ts
├── users/ (module)
│   └── user-repository/ (service)
│       └── 1 artifact, mapping: src/modules/users/user.repository.ts
└── orders/ (module) [requires-audit]
    └── order-service/ (service) [requires-auth, requires-audit]
        └── 3 artifacts, mapping: src/modules/orders/order.service.ts
```

**With `--compact`** (hides metadata lines — artifact counts and mapping paths):

```
My E-Commerce System
├── auth/ (module) [requires-audit]
│   ├── login-service/ (service)
│   ├── session-manager/ (service)
│   └── auth-api/ (interface) [public-api]
├── users/ (module)
│   └── user-repository/ (service)
└── orders/ (module) [requires-audit]
    └── order-service/ (service) [requires-auth, requires-audit]
```

**Subtree filter** (`ygg tree auth/`):

```
auth/ (module) [requires-audit]
├── login-service/ (service)
│   └── 3 artifacts, mapping: src/modules/auth/login.service.ts
├── session-manager/ (service)
│   └── 2 artifacts, mapping: src/modules/auth/session.service.ts
└── auth-api/ (interface) [public-api]
    └── 2 artifacts, mapping: src/modules/auth/auth.controller.ts
```

**Options:**

| Option | Default | Description |
|---|---|---|
| `[path]` | (root) | Show only the subtree rooted at this node path |
| `--depth <n>` | unlimited | Maximum depth to display |
| `--compact` | off | Hide metadata lines (artifact counts, mapping paths) |
| `--tags` | shown | Show tags on nodes |
| `--no-tags` | | Hide tags |

**Exit codes:**

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Path not found (when subtree filter is used) |

---

## Design Principles

1. **All commands are deterministic.** Same graph files → same output. No randomness, no AI.
2. **All output goes to stdout.** Errors go to stderr. Composable with pipes.
3. **JSON output available everywhere.** For programmatic consumption by agents.
4. **Non-destructive by default.** No command modifies graph files (except `init` which creates them). Graph modification is the supervisor's job.
5. **Fast.** All operations are local file reads and computation. No network calls. Should complete in milliseconds for typical graphs.
