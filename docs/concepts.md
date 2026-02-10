# Core Concepts

Yggdrasil operates on two distinct planes: the **graph** and the **code**. Understanding this separation is key.

## The Two Worlds

```
+-----------------------------------------------------+
|                    THE GRAPH                         |
|                                                      |
|  Editable by supervisor (human or AI agent)          |
|  Versioned with git (branch, diff, merge)             |
|  Directory hierarchy of nodes + artifacts            |
|                                                      |
|  ================= BARRIER =================         |
|           (one-directional materialization)          |
|                                                      |
|                    THE CODE                           |
|                                                      |
|  Generated from the graph via materialization         |
|  Should not be edited directly                       |
|  Tests derived from graph verify correctness          |
|                                                      |
+-----------------------------------------------------+
```

| The Graph | The Code |
| --- | --- |
| Editable by supervisor (human or AI) | Generated from the graph |
| Versioned with git | Should not be edited directly |
| Directories + YAML + markdown artifacts | Source files and tests |

### The barrier is one-directional

Graph → Code. Always.

- Want to change system behavior? Change the graph.
- Found a bug? Fix it in the graph (refine a description, add a constraint) and rematerialize.
- Want to refactor? Restructure the graph and let materialization follow.

This is the same principle as Infrastructure as Code (Terraform): you do not SSH into the server and edit files manually — you change the declaration and apply.

### The graph holds complete knowledge

Code is derived from the graph. The graph must hold **complete, concrete knowledge** — no placeholders, no "the agent will figure out during materialization". Everything the code needs must be in the artifacts: descriptions, constraints, edge cases, interfaces. If information is missing from the graph, materialization will produce wrong or inconsistent code.

The pipeline enforces this: the **brief** captures everything, the **plan** specifies full artifact content, **/ygg.apply** writes it to the graph. References to external docs in the repo: use explicit paths (e.g. `docs/api-spec.md`).

### What happens when someone edits code directly

Reality: people will sometimes edit generated code. Hotfixes, quick workarounds, experiments. Yggdrasil does not prevent this — it **detects** it.

The `ygg drift` tool compares the graph's expectations (via `mapping` in `node.yaml`) against actual code on disk. When someone changes code outside the graph, drift detection flags it. The supervisor then decides:

- **Absorb**: update the graph to reflect the change (the code becomes truth)
- **Reject**: rematerialize to restore the code to the graph's state

Drift is not a sin — unresolved drift is. The system ensures drift is always visible and always resolved. See [Drift Detection Specification](/spec/drift-detection) for the full mechanism.

## Glossary

### Node

The fundamental unit of the graph. A **directory** inside `.yggdrasil/` containing a `node.yaml` metadata file and zero or more artifact files.

Nodes form a hierarchy through directory nesting. A node's children are its subdirectories that contain their own `node.yaml`. A node can represent anything the supervisor considers architecturally significant: a module, a component, a service, an interface, a function, a data model — the set of types is open and defined by the supervisor.

### Artifact

Any file in a node's directory **other than** `node.yaml` and child directories. Artifacts document the node: text descriptions, diagrams, API contracts, business rules, sequence diagrams, notes — anything that provides context. Artifacts are free-form. The system does not prescribe their format or names.

### Tag

A label attached to a node (declared in `node.yaml`). Tags serve two purposes:

1. **Classification** — filtering and grouping nodes across the hierarchy.
2. **Aspect binding** — connecting nodes to cross-cutting concerns. A tag links a node to an Aspect.

Tags are defined in `config.yaml` at the graph root. A tag can optionally propagate downward (parent tag automatically applies to children).

### Aspect

A cross-cutting concern that applies to all nodes carrying a specific tag. Defined as a file in `.yggdrasil/aspects/`. When the context builder encounters a node with tag `requires-audit`, it finds the corresponding aspect file and injects its content into the context package — without the supervisor having to specify it on every node individually.

### Flow

An end-to-end process that spans multiple nodes across modules. Defined in `.yggdrasil/flows/`. While relations describe bilateral dependencies ("A uses B"), flows describe multi-node processes ("user goes through A, then B creates C, then D shows the result").

### Relation

A declared dependency between two nodes that are **not** in a parent-child relationship. Relations serve three purposes:

1. **Context enrichment** — the builder includes interface artifacts from related nodes.
2. **Dependency ordering** — the system knows which nodes must be materialized first.
3. **Change propagation** — when a node's interface changes, dependents are flagged.

### Supervisor

The entity responsible for the graph. Can be a human editing files, an AI agent operating within constraints, or both (agent proposes, human reviews). The system does not enforce who or what changes the graph.

### Brief

An unstructured input that initiates changes: a feature request, a bug report, a business requirement. Briefs live in `.yggdrasil/.briefs/` and are the starting point of the [workflow](/workflow).

### Changeset

A set of changes to the graph. In Yggdrasil, a changeset is simply **a git diff on `.yggdrasil/` files**. Creating a feature branch and modifying graph files = creating a changeset. Git's branching, diffing, and merging apply directly.

### Context Package

A complete document generated by `ygg build-context` for a specific node. Contains everything an agent needs to materialize that node, assembled from six layers: global, hierarchical, own, relational, aspects, flows. See [Context Builder Specification](/spec/context-builder) for the full assembly process.

### Materialize

The process of transforming a node into code based on its context package. An AI agent receives the context package and produces implementation files and tests. Materialization follows dependency order; independent nodes can be materialized in parallel. See [Materialization Specification](/spec/materialization).

### Drift

A divergence between the graph and the actual code. Occurs when someone edits generated code directly, bypassing the graph. Detected by `ygg drift`. See [Drift Detection Specification](/spec/drift-detection).

### Blackbox Node

A node with `blackbox: true` in `node.yaml`. Describes existing code for context purposes only — excluded from materialization and context budget checks, but visible in `ygg tree` and included in `ygg affected`. Used for [brownfield adoption](/adoption-guide#brownfield-existing-codebase).

### Module

A grouping node that contains child nodes. Typically has no `mapping` (no code of its own) but provides hierarchical context to all descendants.

## Principles

1. **Graph is truth** — Code is derived. When they disagree, the graph wins (unless you absorb).
2. **Precise context beats large context** — A 2,000-token context package with exactly the right info beats a 200,000-token dump. The size of a context package is a measurable proxy for architectural quality.
3. **CLI is a toolset** — No AI, no API keys. Pure mechanical operations.
4. **Agent commands are instructions, not code** — `/ygg.*` commands are markdown files that tell the agent what to do and which CLI tools to use.
5. **Git is the versioning system** — No custom storage. The graph is files. A changeset is a git diff.
6. **Adoption is incremental** — One module, one feature. Expand at your pace.
7. **Self-calibrating granularity** — The graph starts coarse and becomes more granular over time. If an AI agent produces poor code, the fix is to refine the graph (split nodes, add detail), not to edit the code. The agent should proactively suggest splits during planning.

---

**Want to understand why Yggdrasil exists?** Read the [Vision and Motivation](/spec/vision).

**Next:** [Building a Graph](/graph-guide) — how to create nodes, artifacts, and relations.
