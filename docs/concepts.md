# Core Concepts

Yggdrasil operates on two distinct planes: the **graph** and the **code**. Understanding this separation is key.

## The Two Worlds

| The Graph                               | The Code                      |
| --------------------------------------- | ----------------------------- |
| Editable by supervisor (human or AI)    | Generated from the graph      |
| Versioned with git                      | Should not be edited directly |
| Directories + YAML + markdown artifacts | Source files and tests        |

The barrier is **one-directional**: Graph → Code. Always. Want to change system behavior? Change the graph and rematerialize.

## Key Terms

### Node

The fundamental unit. A **directory** in `yggdrasil/` with a `node.yaml` file and zero or more artifact files. Nodes form a hierarchy through directory nesting — `auth/login-service/` is a child of `auth/`.

### Artifact

Any file in a node's directory other than `node.yaml` and child directories. Artifacts document the node: descriptions, constraints, API contracts, diagrams — whatever provides context for materialization.

### Tag

A label on a node (in `node.yaml`). Tags filter nodes and **bind to aspects** — cross-cutting concerns like "requires audit logging" or "public API."

### Aspect

A cross-cutting concern defined in `yggdrasil/aspects/`. When a node has a matching tag, the aspect's content is injected into its context package. Define once, apply everywhere.

### Flow

An end-to-end process spanning multiple nodes. Defined in `yggdrasil/flows/`. While relations say "A uses B," flows describe "user goes through A → B → C → D."

### Relation

A declared dependency between two nodes. Relations provide context (interface artifacts) and define materialization order. See [Building a Graph](/graph-guide#relations).

### Context Package

A single document assembled by `ygg build-context`. Contains everything an agent needs: global config, hierarchy, node artifacts, related interfaces, aspects, flows. The **specification** for materialization.

### Materialize

Transform a node into code. The agent receives the context package and produces implementation files and tests. See [Workflow](/workflow#materialize).

### Drift

When someone edits generated code directly, bypassing the graph. `ygg drift` detects it. The supervisor then **absorbs** (update graph to match code) or **rejects** (rematerialize from graph).

## Principles

1. **Graph is truth** — Code is derived. When they disagree, the graph wins (unless you absorb).
2. **Precise context beats large context** — A 2,000-token package with exactly the right info beats a 200,000-token dump.
3. **CLI is a toolset** — No AI, no API keys. Pure mechanical operations.
4. **Git is the versioning system** — No custom storage. The graph is files.
5. **Adoption is incremental** — One module, one feature. Expand at your pace.
