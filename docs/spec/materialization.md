# Materialization: From Graph to Code

## What Materialization Is

Materialization is the process of transforming a graph node into source code and tests. An AI agent receives a context package (the output of `ygg build-context`) and produces implementation files.

Materialization is **not** template-based code generation. It is not scaffolding. The agent reads a rich, multi-layered context document and produces an implementation that respects the described behavior, constraints, interfaces, and standards. The quality of the output is a function of the quality of the graph.

---

## The Materialization Loop

```
       +---------------------------------+
       |        Supervisor               |
       |  (defines/refines graph)        |
       +---------------+----------------+ 
                       | edits .yggdrasil/ files
                       v
       +---------------------------------+
       |        Graph                    |
       |  (node.yaml + artifacts)        |
       +---------------+----------------+
                       | ygg build-context
                       v
       +---------------------------------+
       |     Context Package             |
       |  (single document)              |
       +---------------+----------------+
                       | agent reads and implements
                       v
       +---------------------------------+
       |     Code + Tests                |
       |  (written to mapping path)    |
       +---------------+----------------+
                       | run tests
                       v
       +---------------------------------+
       |     Test Results                |
       +---------------+----------------+
                       |
               +-------+-------+
               |               |
            PASS            FAIL
               |               |
            Done    Supervisor refines graph
                    (does NOT edit code)
                            |
                            +-> back to top
```

When tests fail, the fix is **always** in the graph — not in the code. The supervisor adds more detail, splits the node, adds constraints, clarifies the description. Then rematerializes. This loop continues until the output is satisfactory.

This is the self-calibrating granularity principle: the graph adjusts to the level of detail that the AI can handle correctly.

---

## Dependency-Ordered Materialization

Nodes are not materialized in arbitrary order. Relations define dependencies, and `ygg resolve-deps` computes the correct order.

### Why order matters

If `OrderService` calls `PaymentService`, the agent materializing `OrderService` needs to know `PaymentService`'s interface. While the interface is described in the graph (and included in the context package), it is best practice to materialize dependencies first so that:

1. The dependency's implementation exists and can be imported
2. The dependency's tests pass, confirming the interface is correct
3. Integration issues are caught early

### Stages and parallelism

`ygg resolve-deps` produces **stages**. Within a stage, all nodes are independent and can be materialized in parallel. Stages are sequential — stage 2 depends on stage 1 being complete.

```
Stage 1 (parallel):       email-service, sms-provider
                           ↓
Stage 2 (parallel):       password-reset-service
                           ↓
Stage 3:                  auth-api (updated endpoints)
                           ↓
Stage 4:                  integration tests
```

### How the agent handles stages

The `/ygg.materialize` command instructs the agent to:

1. Get the stage list from `ygg resolve-deps`
2. Process stages in order
3. Within each stage with 2+ nodes: **ALWAYS** use subagents when the agent supports them. Do not process sequentially when parallel execution is available. If the agent does not support subagents, process sequentially.
4. For each node: `ygg build-context <path>` → generate code → write files → run node tests

Agents that support sub-agents or parallel execution (like Claude Code with its task system) **must** spawn a sub-agent per node within a stage when the stage has multiple nodes. Each sub-agent receives: (1) the build-context output for that node, (2) the contents of the most recent brief in `.yggdrasil/.briefs/` if any exist — the invocation context gives subagents the "why" (what feature or requirement drove the graph changes), not just the specification. Sub-agents do not communicate with each other — they are fully independent.

---

## What the Agent Produces

For each materialized node, the agent creates:

### Implementation code

Written to the path (or paths) specified in `mapping.path` from `node.yaml`. When `mapping.path` is a list, the agent creates all listed files as part of a single materialization. Aspects and node artifacts may provide guidance on what each file should contain (e.g., a `page` aspect instructing the agent to produce `page.tsx`, `loading.tsx`, and a feature component).

The code:

- Follows the tech stack and standards from the global context
- Implements the behavior described in the node's artifacts
- Uses the interfaces of dependencies as specified in the relational context
- Implements cross-cutting requirements from aspects

### Tests

Co-located with the implementation (per project standards). Tests are derived from the graph:

| Graph Source | Test Type |
|---|---|
| Constraints in artifacts | Unit tests verifying limits, validation rules, edge cases |
| Interface specifications | Contract tests verifying the node's public API |
| Business rules in artifacts | Behavioral tests verifying domain logic |
| Sequence diagrams | Flow tests verifying operation order |
| Aspects | Tests verifying cross-cutting requirements (e.g., audit entries exist) |

Tests are **not** copy-pasted from the graph. The agent reads the graph artifacts and generates appropriate test code. The graph provides *what to test*, the agent decides *how to test it*.

---

## Rematerialization

When the graph changes, affected nodes need to be rematerialized.

### What triggers rematerialization

- A node's artifacts are modified (description, constraints, interface)
- A node's `node.yaml` is modified (relations, tags)
- A related node's interface artifacts change (the context package would be different)
- An aspect file changes (all nodes with the matching tag are affected)
- Global `config.yaml` changes (every node is potentially affected)

### How to identify affected nodes

`ygg resolve-deps --changed` compares graph file timestamps against code file timestamps. If a graph file is newer than its corresponding code file (via `mapping`), the node needs rematerialization.

For interface changes that affect dependent nodes: if `auth-api/interface.yaml` is modified, all nodes with a relation to `auth/auth-api` should be rematerialized because their context package has changed.

### Selective rematerialization

The supervisor can choose:

- **Materialize one node:** `ygg build-context orders/order-service` → agent materializes
- **Materialize all changed:** `ygg resolve-deps --changed` → agent processes the list
- **Materialize a subtree:** materialize a node and all its dependencies

There is no mandatory full rematerialization. The system operates incrementally.

---

## Code Visibility During Materialization

The context package from `ygg build-context` is the **specification** — it defines what the code should do. But during materialization, the agent may also read **existing code at the node's mapping path(s)**.

The agent decides how to proceed:

- **Incremental update** — if the existing code is mostly correct and the change is additive (e.g., adding a category filter to an existing product listing), the agent patches the existing code. Faster, lower risk of losing manual refinements that were absorbed into the graph.
- **Full rewrite** — if the existing code is fundamentally wrong, outdated, or the change restructures the file significantly, the agent rewrites from scratch. Cleaner result, but any manual tweaks not captured in the graph are lost.

The choice is the agent's — whichever is more efficient and produces correct code.

### What the agent must NOT see

The agent must not read **other modules' code** during materialization. Only:

1. The context package (specification — what to build)
2. Existing code at the node's own mapping path(s) (starting point — what already exists)

Reading other modules' code reintroduces the context problem that Yggdrasil exists to solve. The context package already contains everything the agent needs about dependencies — their interfaces, contracts, and descriptions — via the relational layer.

---

## Generator Independence

Yggdrasil does not prescribe which AI model or tool generates the code. The context package is a standard markdown document that any AI can read:

- **Claude Code** — reads the context package in its conversation, generates code
- **Cursor Agent** — reads the package, produces implementation in the editor
- **Gemini CLI** — processes the package, writes files
- **Any future agent** — same input format, same workflow

The agent command `/ygg.materialize` is installed for the specific agent during `ygg init`, but the context package format is universal. Switching agents means switching the command files, not changing the graph or the CLI.

---

## Tool-Based Materialization

Not every node produces code by the agent writing files directly. Some nodes describe outcomes achieved through external tools:

- **Database schema** — the node's artifacts describe the target schema; the agent runs `supabase migration new` (or equivalent) to produce a migration file.
- **Infrastructure** — the node describes the desired state; the agent runs CLI commands to achieve it.
- **Package configuration** — the node describes dependencies or settings; the agent updates `package.json`, `tsconfig.json`, or similar.

In these cases, the node's artifacts and aspects include instructions about **which tools to use**, not just what the code should do. The agent follows these instructions as part of materialization.

Nodes with tool-based outputs may or may not have a `mapping`. If they do, drift detection applies normally. If they do not (e.g., append-only migration files), the node serves as documentation and context — other nodes can relate to it and receive its artifacts during context building.

---

## Quality Feedback Loop

If materialized code is not good enough:

1. **Do not edit the code.** (Exception: trivial fixes that you then absorb into the graph.)
2. **Identify why.** Is the description vague? Are constraints missing? Is the interface underspecified? Is the node too large?
3. **Refine the graph:**
   - Add more detail to artifacts
   - Split a large node into smaller child nodes
   - Add explicit constraints that the agent was guessing about
   - Add a sequence diagram to clarify the flow
4. **Rematerialize.** The new context package will be more precise, and the output will be better.

This loop is the system's self-calibration mechanism. Over time, the graph converges on the level of detail that produces consistently good code.
