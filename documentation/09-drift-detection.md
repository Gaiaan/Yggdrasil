# 09 — Drift Detection: Keeping Graph and Code in Sync

## What Drift Is

Drift occurs when generated code is modified outside the graph workflow. Someone opens a file, edits it, and saves — bypassing the graph entirely. The graph says one thing; the code does another.

Drift is not a bug or an error. It is a **natural occurrence** in real-world development. Hotfixes, experiments, quick workarounds, pair programming sessions where someone types code directly — all of these create drift. The system does not prevent drift. It **detects** it and ensures it is resolved.

---

## How Drift Detection Works

### The mapping

Each node can declare a `mapping` in its `node.yaml`:

```yaml
mapping:
  path: src/modules/orders/order.service.ts
```

This tells the system: "the code for this node lives at this path." The mapping can point to a single file or a directory.

### The drift state

The CLI maintains a file `.yggdrasil/.drift-state` that records content hashes of mapped files after each materialization. This file is committed to git alongside the graph.

```yaml
# .yggdrasil/.drift-state (auto-generated, do not edit manually)
entries:
  orders/order-service:
    path: src/modules/orders/order.service.ts
    hash: sha256:a1b2c3d4e5f6...
    materialized_at: 2026-02-09T14:30:00Z
  auth/login-service:
    path: src/modules/auth/login.service.ts
    hash: sha256:f6e5d4c3b2a1...
    materialized_at: 2026-02-09T14:28:00Z
```

### The comparison

When `ygg drift` runs:

1. For each entry in `.drift-state`:
   a. Read the mapped file(s) from disk — a node may map to one file or a list of files
   b. Compute content hash for each file
   c. Compare against stored hashes
2. If any hash differs → **drift detected** (report specifies which file(s) changed)
3. If any mapped file does not exist → **missing** (deleted or not yet materialized)
4. For nodes with `mapping` but no entry in `.drift-state` → **unmaterialized**

### What updates `.drift-state`

The `.drift-state` file is updated when:

- The agent materializes a node (writes code to the mapping path)
- The supervisor explicitly runs a command to record the current state (absorbing drift)

The CLI does **not** automatically update `.drift-state`. It is updated as a side effect of materialization or explicit absorption.

---

## `ygg drift` Output

```
$ ygg drift

orders/order-service → src/modules/orders/order.service.ts
  ✗ DRIFT: file modified since last materialization
    Last materialized: 2026-02-09T14:30:00Z
    File hash changed: a1b2c3... → 7f8e9d...

auth/login-service → src/modules/auth/login.service.ts
  ✓ OK: matches last materialization

auth/session-manager → src/modules/auth/session.service.ts
  ✓ OK: matches last materialization

auth/auth-api → src/modules/auth/auth.controller.ts
  - UNMATERIALIZED: no drift state recorded

4 nodes checked. 1 drift, 1 unmaterialized.
```

The JSON output (`--format json`) includes the same information in machine-readable form for agent consumption.

---

## Resolving Drift

When drift is detected, the supervisor has three options:

### Option 1: Absorb

Accept the code change as intentional. Update the graph to reflect reality.

**When to use:** The code change was a deliberate improvement, hotfix, or experiment that should become the new truth.

**Workflow:**

1. Review the diff (the agent or the user looks at what changed)
2. Update the relevant artifacts in the node's directory to reflect the change
3. Run `ygg drift --absorb <node-path>` to update `.drift-state` with the current file hash

After absorption, the graph matches the code. No rematerialization needed.

### Option 2: Reject

Discard the code change. Rematerialize from the graph.

**When to use:** The code change was a mistake, a temporary workaround that should be undone, or an unauthorized change.

**Workflow:**

1. Run `/ygg.materialize` for the affected node
2. The agent generates fresh code from the graph context, overwriting the drift
3. `.drift-state` is updated with the new hash

After rejection, the code matches the graph again.

### Option 3: Defer

Acknowledge the drift but do not resolve it yet.

**When to use:** The change is intentional but updating the graph is not a priority right now. Not recommended long-term — deferred drift accumulates.

**Workflow:** Nothing. The drift remains flagged on every `ygg drift` run until resolved.

---

## Drift in CI

`ygg drift` can be run in CI pipelines to enforce drift policies:

```yaml
# Example CI step
- name: Check for drift
  run: |
    npx ygg drift
    if [ $? -ne 0 ]; then
      echo "Drift detected. Resolve before merging."
      exit 1
    fi
```

Exit code 0 means no drift. Exit code 1 means drift detected. Teams can choose whether drift blocks merges or is advisory.

---

## Mapping Strategies

### Single file mapping

Most common. One node maps to one file:

```yaml
mapping:
  path: src/modules/orders/order.service.ts
```

### Multi-file mapping

A node maps to a list of specific files. Common when a single architectural concept produces files across multiple locations (e.g., framework conventions):

```yaml
mapping:
  path:
    - app/shop/page.tsx
    - app/shop/loading.tsx
    - src/features/shop/ProductListingPage.tsx
```

Drift detection tracks each file independently. If any file in the list changes, the node is flagged as drifted — the report specifies which file(s) diverged.

### Directory mapping

A node maps to a directory. Drift detection hashes all files in the directory:

```yaml
mapping:
  path: src/modules/orders/
```

### No mapping

A node has no `mapping` field. This is valid — the node exists in the graph for documentation and context purposes but does not correspond to a specific code artifact. Parent nodes (modules) often have no mapping because their children are the ones that map to code.

### Mapping to test files

Test nodes or test-related artifacts can map to test files:

```yaml
mapping:
  path: src/modules/orders/__tests__/order.service.spec.ts
```

---

## Drift vs. Rematerialization Need

Drift and "needs rematerialization" are related but distinct:

| Condition                   | Meaning                                                                |
| --------------------------- | ---------------------------------------------------------------------- |
| **Drift**                   | Code changed, graph did not. Code is ahead.                            |
| **Needs rematerialization** | Graph changed, code did not. Graph is ahead.                           |
| **Both**                    | Both graph and code changed independently. Requires manual resolution. |
| **Neither**                 | Graph and code are in sync.                                            |

`ygg drift` detects code-ahead drift. `ygg resolve-deps --changed` detects graph-ahead need for rematerialization. Running both gives a complete picture of sync status.
