# 02 — Core Concepts and Terminology

## The Two Worlds: Graph and Code

Yggdrasil operates on two distinct but connected planes:

```
┌─────────────────────────────────────────────────────┐
│                    THE GRAPH                          │
│                                                      │
│  Editable by supervisor (human or AI agent)          │
│  Versioned with git (branch, diff, merge)            │
│  Directory hierarchy of nodes + artifacts             │
│                                                      │
│  ════════════════ BARRIER ═══════════════════════     │
│           (one-directional materialization)            │
│                                                      │
│                    THE CODE                            │
│                                                      │
│  Generated from the graph via materialization         │
│  Should not be edited directly                        │
│  Tests derived from graph verify correctness          │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### The barrier is one-directional

Graph → Code. Always.

- Want to change system behavior? Change the graph.
- Found a bug? Fix it in the graph (refine a description, add a constraint) and rematerialize.
- Want to refactor? Restructure the graph and let materialization follow.

This is the same principle as Infrastructure as Code (Terraform): you do not SSH into the server and edit files manually — you change the declaration and apply.

### What happens when someone edits code directly

Reality: people will sometimes edit generated code. Hotfixes, quick workarounds, experiments. Yggdrasil does not prevent this — it **detects** it.

The `ygg drift` tool compares the graph's expectations (via `mapping` in `node.yaml`) against actual code on disk. When someone changes code outside the graph, drift detection flags it. The supervisor then decides:

- **Absorb**: update the graph to reflect the change (the code becomes truth)
- **Reject**: rematerialize to restore the code to the graph's state

Drift is not a sin — unresolved drift is. The system ensures drift is always visible and always resolved.

---

## Glossary of Terms

### Node

The fundamental unit of the graph. A **directory** inside `.yggdrasil/` containing a `node.yaml` metadata file and zero or more artifact files.

Nodes form a hierarchy through directory nesting. A node's children are its subdirectories that contain their own `node.yaml`.

A node can represent anything the supervisor considers architecturally significant: a module, a component, a service, an interface, a function, a data model — the set of types is open and defined by the supervisor.

### Artifact

Any file in a node's directory **other than** `node.yaml` and child directories. Artifacts document the node: text descriptions, diagrams, API contracts, business rules, sequence diagrams, notes — anything that provides context.

Artifacts are free-form. The system does not prescribe their format or names. When building context, the CLI reads all artifacts in the node's directory and includes them.

### Tag

A label attached to a node (declared in `node.yaml`). Tags serve two purposes:

1. **Classification** — filtering and grouping nodes across the hierarchy.
2. **Aspect binding** — connecting nodes to cross-cutting concerns. A tag links a node to an Aspect.

Tags are defined in `config.yaml` at the graph root. A tag can optionally propagate downward (parent tag automatically applies to children).

### Aspect

A cross-cutting concern that applies to all nodes carrying a specific tag. Defined as a file in `.yggdrasil/aspects/`.

When the context builder encounters a node with tag `requires-audit`, it finds the corresponding aspect file and injects its content into the context package. The agent materializing the node then knows it must implement audit logging — without the supervisor having to specify it on every node individually.

### Flow

An end-to-end process that spans multiple nodes across modules. Defined as a directory in `.yggdrasil/flows/` containing a `flow.yaml` metadata file and artifact files (descriptions, sequence diagrams, error handling notes).

While relations describe bilateral dependencies between nodes ("A uses B"), flows describe multi-node processes ("user goes through A, then B creates C, then D shows the result"). When building context for a node, the context builder includes artifacts from all flows the node participates in — giving the agent awareness of the end-to-end process without including other nodes' full artifacts.

### Relation

A declared dependency between two nodes that are **not** in a parent-child relationship. Defined in `node.yaml` under `relations`.

Relations serve three purposes:

1. **Context enrichment** — when building context for a node, the builder includes interface artifacts from related nodes. The agent knows what contracts it must respect.
2. **Dependency ordering** — the system knows which nodes must be materialized before others.
3. **Change propagation** — when a node's interface changes, all nodes with a relation to it are flagged as potentially affected.

### Supervisor

The entity responsible for the graph. Can be:

- **A human** — editing files directly in an editor, or using agent commands conversationally.
- **An AI agent** — operating within constraints set by a human.
- **Both** — an agent proposes changes, a human reviews and commits.

Supervisor is not a distinct component in the system. It is simply "whoever changes the graph." The system does not enforce who or what that is.

### Brief

An unstructured input that initiates changes: a feature request, a bug report, a business requirement, an idea. Briefs live in `.yggdrasil/.briefs/` and are the starting point of the workflow.

A brief is refined through clarification, turned into a plan of graph changes, and eventually applied to the graph. It is analogous to a ticket or user story — but processed through the graph workflow rather than a flat task list.

### Changeset

A set of changes to the graph. In Yggdrasil, a changeset is simply **a git diff on `.yggdrasil/` files**. No separate mechanism is needed.

- Creating a feature branch and modifying graph files = creating a changeset.
- `git diff --stat .yggdrasil/` = viewing the changeset.
- Merging the branch = applying the changeset.

Git is the versioning system. The graph lives in files. Git's branching, diffing, and merging apply directly.

### Context Package

A complete document generated by `ygg build-context` for a specific node. Contains everything an agent needs to materialize that node:

1. Global context (tech stack, standards) from `config.yaml`
2. Hierarchical context (from parent nodes up to root)
3. The node's own artifacts (description, constraints, interface, business rules, diagrams)
4. Relational context (interface artifacts from related nodes)
5. Aspect context (injected from aspects matching the node's tags)
6. Flow context (artifacts from flows the node participates in)

The context package is the **specification** for materialization — it defines what the code should do. The agent may also read existing code at the node's mapping path(s) to decide whether to patch or rewrite, but must not read other modules' code. This is how the context problem is solved.

### Materialize

The process of transforming a node into code based on its context package. An AI agent receives the context package and produces implementation files and tests.

Materialization follows dependency order: nodes that other nodes depend on are materialized first. Independent nodes can be materialized in parallel by separate sub-agents.

### Drift

A divergence between the graph and the actual code. Occurs when someone edits generated code directly, bypassing the graph. Detected by `ygg drift`, which compares file state against graph expectations.

---

## Key Principles

### 1. The graph is the single source of truth

The graph defines what the system is. Code is derived from it. When graph and code disagree, the graph is authoritative (unless the supervisor explicitly absorbs code changes into the graph).

### 2. Precise context beats large context

A 2,000-token context package with exactly the right information produces better code than a 200,000-token dump of the entire codebase. Yggdrasil's value comes from **assembling the right context**, not from having a bigger context window.

The size of a context package is a **measurable proxy for architectural quality**. A large package means the node has too many dependencies, too broad a scope, or low cohesion — the same symptoms that indicate poor design in traditional software engineering. A small, focused package indicates Single Responsibility, loose coupling, and clear boundaries. This applies equally to AI agents and human developers: if you need to read 15 files to understand a module, that module is poorly designed regardless of who is reading.

### 3. The CLI is a toolset, not an agent

The `ygg` CLI does mechanical work: parsing files, building context, resolving dependencies, detecting drift. It has no API keys, talks to no LLM, makes no decisions. AI work is done by whatever agent the user already has (Cursor, Claude Code, Gemini CLI).

### 4. Agent commands are instructions, not code

`/ygg.*` commands are markdown files that tell the agent what to do and which CLI tools to use. They are installed into the agent's command directory. They do not contain application logic — they contain workflow instructions.

### 5. The supervisor can be anyone or anything

A human editing YAML in vim. An AI agent creating nodes conversationally. A CI pipeline triggering materialization on merge. The system does not prescribe who operates the graph.

### 6. Git is the versioning system

No custom versioning, no event sourcing, no graph database. The graph is files. Git handles branching, merging, history, diffing. A changeset is a git diff.

### 7. Adoption is incremental

The graph does not need to cover the entire codebase. It can describe one module, or ten, or a thousand. Code outside the graph coexists peacefully. Coverage grows at the supervisor's pace.

### 8. Self-calibrating granularity

The graph starts coarse and becomes more granular over time. A new module might begin as a single node with a broad description. As requirements grow, the supervisor — or the agent during `/ygg.plan` — identifies nodes that have become too large and splits them into child nodes.

If an AI agent produces poor code for a node, the fix is not to edit the code — it is to refine the graph: split the node into smaller pieces, add more artifacts, add constraints. When a node is split, existing code at the old mapping path is rematerialized as smaller, focused files.

The agent should proactively suggest splits during planning: "This node maps to a 500-line file and the new requirements would add more complexity — I recommend splitting it into X, Y, and Z child nodes before proceeding."

This works in both directions:

- **Coarse → granular:** A placeholder node is split as requirements accumulate.
- **Existing code → graph-managed:** A node that was created to describe an existing large file can be split in the graph first, then rematerialized as separate files — graph refactoring precedes code refactoring.

The graph calibrates itself to the granularity that produces good results.
