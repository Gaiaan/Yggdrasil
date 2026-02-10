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

Creates `.yggdrasil/` with `config.yaml`, `aspects/`, `flows/`, `.briefs/`, and installs agent commands.

| Option | Description |
|--------|-------------|
| `--agent <name>` | Target: `claude`, `cursor`, `copilot`, `gemini` |
| `--commands-only` | Only update agent commands; do not touch config (requires `--agent`) |

---

## ygg build-context

Build a complete context package for a node.

```bash
ygg build-context orders/order-service
ygg build-context auth/login-service --format json
```

Assembles six layers: global, hierarchy, own, relations, aspects, flows. Output to stdout.

| Option | Default | Description |
|--------|---------|-------------|
| `--format` | `markdown` | `markdown` or `json` |

| Exit | Meaning |
|------|---------|
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

| Mode | Description |
|------|-------------|
| (none) | All leaf nodes with mapping |
| `--changed` | Only nodes whose graph is newer than code |
| `--node <path>` | Specific node and its dependencies |

Output: stages with parallel/sequential grouping. Blackbox nodes excluded.

| Exit | Meaning |
|------|---------|
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

Validates: relation targets exist, tags defined, aspects valid, no cycles, mappings unique, flow participants exist, no tag conflicts, structure (no orphan dirs). Warns on context budget exceeded.

| Exit | Meaning |
|------|---------|
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

Compares file hashes against `yggdrasil/.drift-state`. Reports drift, missing, or unmaterialized.

| Exit | Meaning |
|------|---------|
| 0 | No drift |
| 1 | Drift detected |
| 2 | Missing mapped files |

---

## ygg status

Summary of graph state.

```bash
ygg status
```

Shows: node count, tags, aspects, relations, mappings, materialization status, drift status.

---

## ygg affected

Show nodes and flows that depend on a given node.

```bash
ygg affected data/products/
ygg affected data/products/ --format json
```

Lists nodes with relations targeting the node, and flows that list it.

| Exit | Meaning |
|------|---------|
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

**Note:** Running `ygg tree` without `--depth` on a large graph produces unbounded output. Agents should use `--depth 1 --compact` first, then drill into subtrees.

| Option | Description |
|--------|-------------|
| `[path]` | Show only the subtree rooted at this path |
| `--depth <n>` | Max depth |
| `--compact` | Hide metadata (artifact counts, mapping paths) |
| `--tags` | Show tags (default) |
| `--no-tags` | Hide tags |

---

## Design Principles

1. **Deterministic** — Same input → same output.
2. **Stdout for output, stderr for errors** — Composable with pipes.
3. **`--format json`** available on all commands.
4. **Non-destructive** — No command modifies graph files (except `init`).
