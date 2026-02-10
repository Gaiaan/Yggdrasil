# CLI Reference

The `ygg` CLI is a pure toolset — no AI, no API keys. It reads graph files, builds context, resolves dependencies, validates consistency, detects drift.

**Install:** `npm install -g @gaiaan/yggdrasil-cli`

**Runtime:** Node.js 22+

---

## ygg init

Initialize a Yggdrasil graph in the current project.

```bash
ygg init [--agent <agent>]
ygg init --agent cursor --commands-only   # Update commands only (e.g. after npm update)
```

**What it does:**

1. Creates `.yggdrasil/` directory with `config.yaml`, `aspects/`, `flows/`, `.briefs/`
2. Installs agent command files to the appropriate directory:
   - `--agent claude` → `.claude/commands/ygg-*.md`
   - `--agent cursor` → `.cursor/commands/ygg-*.md`
   - `--agent gemini` → `.gemini/commands/ygg-*.toml`
   - `--agent copilot` → `.github/agents/ygg-*.agent.md`
   - (no flag) → prompts for agent selection

**Adapter format differences:**

| Agent | Key differences |
|-------|-----------------|
| Cursor | Canonical markdown, no transformations |
| Claude Code | Adds `name` field to frontmatter (e.g., `name: ygg-brief`) |
| Copilot | Outputs `.agent.md`; adds `name`, `tools`; converts `command:` handoffs to `agent:` |
| Gemini CLI | Converts markdown to TOML; uses `prompt = """..."""` flat format |

**With `--commands-only`:** Only updates agent commands. Does not touch `config.yaml` or directories. Use after `npm update` to refresh command templates.

| Option | Description |
|---|---|
| `--agent <name>` | Target: `claude`, `cursor`, `copilot`, `gemini` |
| `--commands-only` | Only update agent commands; do not touch config (requires `--agent`) |

---

## ygg build-context

Build a complete context package for a node.

```bash
ygg build-context orders/order-service
ygg build-context auth/login-service --format json
```

**What it does:**

1. Resolves the node at `.yggdrasil/<node-path>/`
2. Reads `config.yaml` (global layer)
3. Walks up directory hierarchy, collecting ancestor artifacts (hierarchical layer)
4. Reads all artifacts from the node's directory (own layer)
5. For each relation, reads target node's artifacts (relational layer)
6. Finds aspects matching the node's tags (aspect layer)
7. Includes artifacts from flows listing this node (flow layer)
8. Assembles into a single document

Output includes a metadata footer with size information:

```
---
Context size: 2,847 tokens
Layers: global, hierarchy (1), own (3 artifacts), relations (2), aspects (1), flows (1)
```

If context exceeds `limits.context_warning_tokens`, a warning is printed to stderr:

```
⚠ Context for shop/checkout is 12,400 tokens (threshold: 8,000).
  Consider splitting the node or reducing relations.
```

| Option | Default | Description |
|---|---|---|
| `--format` | `markdown` | `markdown` or `json` |

| Exit | Meaning |
|---|---|
| 0 | Success |
| 1 | Node not found |
| 2 | Broken relation target |

---

## ygg resolve-deps

Compute dependency order for materialization.

```bash
ygg resolve-deps
ygg resolve-deps --changed
ygg resolve-deps --node orders/order-service
ygg resolve-deps --format json
```

**What it does:**

1. Parses all `node.yaml` files
2. Excludes blackbox nodes (`blackbox: true`)
3. Builds dependency graph from `relations`
4. Topological sort for materialization order
5. Groups independent nodes into parallel stages

| Mode | Description |
|---|---|
| (none) | All leaf nodes with mapping |
| `--changed` | Only nodes whose graph is newer than code |
| `--node <path>` | Specific node and its transitive dependencies |

**Example output (text):**

```
Stage 1 (parallel):
  - auth/password-reset-email
  - notifications/email-service

Stage 2 (parallel):
  - auth/password-reset-service

Stage 3:
  - auth/auth-api
```

**Example output (json):**

```json
{
  "stages": [
    { "stage": 1, "parallel": true, "nodes": ["auth/password-reset-email", "notifications/email-service"] },
    { "stage": 2, "parallel": true, "nodes": ["auth/password-reset-service"] },
    { "stage": 3, "parallel": false, "nodes": ["auth/auth-api"] }
  ]
}
```

| Option | Default | Description |
|---|---|---|
| `--format` | `text` | `text` or `json` |

| Exit | Meaning |
|---|---|
| 0 | Success |
| 1 | Circular dependency |
| 2 | Broken relation |

---

## ygg check

Validate graph consistency.

```bash
ygg check
ygg check --format json
```

**What it validates:**

| Check | Description |
|---|---|
| Relation targets exist | Every `relations[].target` points to an existing node |
| Tags defined | Every tag in `node.yaml` is defined in `config.yaml` |
| Aspects valid | Every aspect references a defined tag |
| No circular dependencies | Relations do not form cycles |
| Mappings unique | No two nodes map to the same code path |
| Flow participants exist | Every node listed in `flow.yaml` exists |
| No tag conflicts | No node carries conflicting tags (per `conflicts_with`) |
| Structure valid | Directories under `.yggdrasil/` (except reserved) contain `node.yaml` |
| Context budget | Warns when a node's context exceeds `limits.context_warning_tokens` |

**Example output:**

```
✓ 23 nodes scanned
✓ Relations: all targets valid
✗ Tags: 'requires-email' used in orders/notification-handler but not defined in config.yaml
✓ Aspects: all tags valid
✓ Dependencies: no cycles
✓ Mappings: no duplicates
✓ Flows: all participants valid
✗ Conflicts: node shop/widget has tags [server-only, client-interactive] which conflict
⚠ Context budget: shop/checkout context is 12,400 tokens (threshold: 8,000)

2 issues, 1 warning.
```

| Exit | Meaning |
|---|---|
| 0 | No issues |
| 1 | Issues found |

---

## ygg drift

Detect divergence between graph and code.

```bash
ygg drift
ygg drift --format json
ygg drift --node orders/order-service
```

For each node with a `mapping`:

1. Check if mapped file(s) exist
2. Compare content hash against `.yggdrasil/.drift-state`
3. Report differences

**Example output:**

```
orders/order-service → src/modules/orders/order.service.ts
  ✗ DRIFT: file modified since last materialization (14 lines changed)

auth/login-service → src/modules/auth/login.service.ts
  ✓ OK: matches last materialization

auth/auth-api → src/modules/auth/auth.controller.ts
  ✗ MISSING: mapped file does not exist (not yet materialized?)

3 nodes checked. 1 drift detected, 1 missing.
```

| Exit | Meaning |
|---|---|
| 0 | No drift |
| 1 | Drift detected |
| 2 | Missing mapped files |

See [Drift Detection Specification](/spec/drift-detection) for the full mechanism.

---

## ygg status

Summary of graph state.

```bash
ygg status
ygg status --format json
```

| Option | Default | Description |
|---|---|---|
| `--format` | `text` | `text` or `json` |

**Example output (text):**

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

**Example output (json):**

```json
{
  "graph": "My E-Commerce System",
  "stack": { "language": "TypeScript", "runtime": "Node 22", "framework": "NestJS" },
  "nodes": { "total": 23, "byType": { "module": 5, "service": 12, "interface": 4, "model": 2 }, "blackbox": 0, "mapped": 15 },
  "tags": { "defined": 4, "inUse": 3 },
  "aspects": 2,
  "flows": 1,
  "relations": 18,
  "drift": { "upToDate": 12, "drift": 1, "unmaterialized": 1 }
}
```

---

## ygg affected

Show nodes and flows that depend on a given node.

```bash
ygg affected data/products/
ygg affected data/products/ --format json
```

**What it does:**

1. Scans all `node.yaml` files for `relations` targeting the given node
2. Scans all `flow.yaml` files for flows listing the given node
3. Reports both lists

**Example output:**

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

| Option | Default | Description |
|---|---|---|
| `--format` | `text` | `text` or `json` |

| Exit | Meaning |
|---|---|
| 0 | Success |
| 1 | Node not found |

---

## ygg tree

Display graph as directory tree.

```bash
ygg tree
ygg tree auth/
ygg tree --depth 2 --compact
ygg tree auth/ --depth 1
```

**Note on large graphs:** Running `ygg tree` without `--depth` produces unbounded output. Agents should use `--depth 1 --compact` first, then drill into subtrees.

**Example output:**

```
My E-Commerce System
  auth/ (module) [requires-audit]
    login-service/ (service)
      3 artifacts, mapping: src/modules/auth/login.service.ts
    session-manager/ (service)
      2 artifacts, mapping: src/modules/auth/session.service.ts
    auth-api/ (interface) [public-api]
      2 artifacts, mapping: src/modules/auth/auth.controller.ts
  users/ (module)
    user-repository/ (service)
  orders/ (module) [requires-audit]
    order-service/ (service) [requires-auth, requires-audit]
      3 artifacts, mapping: src/modules/orders/order.service.ts
```

**With `--compact`** (hides artifact counts and mapping paths):

```
My E-Commerce System
  auth/ (module) [requires-audit]
    login-service/ (service)
    session-manager/ (service)
    auth-api/ (interface) [public-api]
  users/ (module)
    user-repository/ (service)
  orders/ (module) [requires-audit]
    order-service/ (service) [requires-auth, requires-audit]
```

| Option | Default | Description |
|---|---|---|
| `[path]` | (root) | Show only the subtree rooted at this path |
| `--depth <n>` | unlimited | Max depth |
| `--compact` | off | Hide metadata (artifact counts, mapping paths) |
| `--tags` | shown | Show tags (default) |
| `--no-tags` | | Hide tags |

| Exit | Meaning |
|---|---|
| 0 | Success |
| 1 | Path not found |

---

## Design Principles

1. **Deterministic** — Same input → same output. No randomness, no AI.
2. **Stdout for output, stderr for errors** — Composable with pipes.
3. **`--format json`** available on all commands — for programmatic consumption by agents.
4. **Non-destructive** — No command modifies graph files (except `init`). Graph modification is the supervisor's job.
5. **Fast** — All operations are local file reads and computation. No network calls.
