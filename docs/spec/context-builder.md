# Context Builder: Assembling the Right Context

## Purpose

The context builder is the core value engine of Yggdrasil. It answers one question: **what does an AI agent need to see to correctly materialize a specific node?**

The answer is a **context package** — a single document assembled from six layers of the graph. The agent receives this document and nothing else. No raw codebase access, no searching through files, no guessing about architecture. Just the right information.

---

## The Six Layers

When `ygg build-context <node-path>` runs, it assembles context from six sources in order:

```
Layer 1: Global          ← config.yaml (stack, standards)
Layer 2: Hierarchical    ← artifacts from parent nodes, root to direct parent
Layer 3: Own             ← artifacts from the node's own directory
Layer 4: Relational      ← artifacts from nodes declared in relations
Layer 5: Aspects         ← aspect files matching the node's tags
Layer 6: Flows           ← artifacts from flows that list this node as a participant
```

### Layer 1: Global Context

**Source:** `yggdrasil/config.yaml`

Contains project-wide information that every node needs:

- Technology stack (language, framework, database, runtime)
- Coding standards and conventions
- Testing approach

This layer is identical for every node in the project.

### Layer 2: Hierarchical Context

**Source:** Artifacts from every ancestor node, from the root down to the node's direct parent.

The builder walks up the directory tree from the target node to the `yggdrasil/` root, collecting artifacts from each node it passes through.

Example for `orders/order-service/`:

1. `yggdrasil/orders/` — read all artifacts (description.md, business-rules.md, etc.)

If the hierarchy were deeper (`platform/commerce/orders/order-service/`), the builder would collect from `platform/`, then `platform/commerce/`, then `platform/commerce/orders/`.

This layer provides the **module-level context**: what domain is this node part of, what are the rules and conventions of that domain.

### Layer 3: Own Context

**Source:** All artifacts in the node's own directory.

This is the node's direct documentation: its description, constraints, interface specification, diagrams, business rules, examples — everything the supervisor has written about this specific node.

This layer is the **primary specification** for materialization.

### Layer 4: Relational Context

**Source:** Artifacts from nodes listed in the `relations` field of `node.yaml`.

For each related node, the builder reads its artifacts — particularly interface specifications, API contracts, and descriptions. The agent materializing the current node needs to know **what contracts it must respect** when interacting with dependencies.

The builder does **not** recursively follow relations of related nodes. Only direct relations are included. This keeps context bounded and predictable.

Example: If `order-service` has a relation to `auth/auth-api`, the builder includes artifacts from `auth/auth-api/` (such as `openapi.yaml`). But it does not include artifacts from `auth/login-service/` even though that is a sibling of `auth-api`.

### Layer 5: Aspect Context

**Source:** Aspect files from `yggdrasil/aspects/` whose tag matches a tag on the node.

If the node (or an ancestor, for propagating tags) carries tag `requires-audit`, and there is an aspect file `aspects/audit-logging.yaml` with `tag: requires-audit`, the aspect's content is included.

This layer injects cross-cutting requirements without the supervisor having to repeat them on every node.

### Layer 6: Flow Context

**Source:** Artifacts from flow directories in `yggdrasil/flows/` where the node is listed in `flow.yaml`'s `nodes` field.

The builder scans all `flow.yaml` files and includes artifacts from flows that list the current node as a participant. This gives the agent awareness of the end-to-end process — how the node fits with other nodes in a multi-step workflow.

Flow context includes only the flow's own artifacts (descriptions, sequence diagrams, error handling notes). It does **not** include other participating nodes' artifacts — that would duplicate or exceed the relational layer. The flow provides the "big picture"; relations provide the specific interfaces.

---

## Output Format

The context package is a **single markdown document** written to stdout. It is structured with clear section headers so the agent can navigate it.

```markdown
# Context Package: OrderService
# Path: orders/order-service
# Generated: 2026-02-09T14:30:00Z

---

## Global Context

**Project:** My E-Commerce System

**Stack:**
- Language: TypeScript
- Runtime: Node 22
- Framework: NestJS
- Database: PostgreSQL
- Cache: Redis

**Standards:**
ESLint + Prettier configuration.
Clean Architecture pattern.
camelCase for functions, PascalCase for classes.

**Testing:**
Jest as test framework.
Test coverage target: 80%.
Co-locate test files with source (*.spec.ts).

---

## Module Context (orders/)

[Contents of yggdrasil/orders/description.md]

[Contents of yggdrasil/orders/business-rules.md]

---

## Node: OrderService

### description.md
[Contents of yggdrasil/orders/order-service/description.md]

### state-machine.md
[Contents of yggdrasil/orders/order-service/state-machine.md]

---

## Dependencies

### auth/auth-api (uses)

#### openapi.yaml
[Contents of yggdrasil/auth/auth-api/openapi.yaml]

### payments/payment-service (calls)

#### description.md
[Contents of yggdrasil/payments/payment-service/description.md]

#### interface.yaml
[Contents of yggdrasil/payments/payment-service/interface.yaml]

---

## Aspects

### Audit Logging (tag: requires-audit)

[Contents of yggdrasil/aspects/audit-logging.yaml]

---

## Flows

### Checkout Flow

[Contents of yggdrasil/flows/checkout-flow/description.md]

[Contents of yggdrasil/flows/checkout-flow/sequence.md]

---

## Materialization Target

**Mapping:** src/modules/orders/order.service.ts
```

### Design decisions

- **Markdown output** — universally readable by all AI agents.
- **Stdout** — composable with pipes and redirects. An agent command can capture it into a variable.
- **Section headers** — clear separation of layers. The agent knows which part is global, which is module-level, which is the node itself, which are dependencies.
- **Full artifact inclusion** — artifacts are included verbatim, not summarized. The agent sees exactly what the supervisor wrote.
- **No code included** — the context package contains no source code. Only graph artifacts. The agent may separately read existing code at the node's mapping path(s) to decide whether to patch or rewrite, but the context package is the specification of *what* the code should do.

---

## What the Context Builder Does NOT Do

- **It does not call any AI.** It is a mechanical file-assembly operation.
- **It does not read source code.** Only graph files.
- **It does not follow transitive relations.** If A relates to B and B relates to C, building context for A includes B's artifacts but not C's.
- **It does not filter or summarize artifacts.** Everything is included verbatim.
- **It does not validate the graph.** That is the job of `ygg check`.

---

## Why This Solves the Context Problem

Traditional agent workflow:

```
Agent receives: "Implement OrderService"
Agent does: searches codebase → reads 50 files → loses track → makes mistakes
```

Yggdrasil workflow:

```
Agent receives: context package (one document, ~2000-5000 tokens)
Agent does: reads package → implements exactly what is described → respects interfaces
```

The context package is **bounded, precise, and complete**:

- **Bounded** — the agent sees only what is relevant. No noise from unrelated modules.
- **Precise** — constraints, interfaces, and rules are explicit. No guessing.
- **Complete** — everything needed is there: global standards, module context, node description, dependency interfaces, cross-cutting aspects.

This works regardless of project size. A 10-node graph and a 10,000-node graph produce context packages of similar size for any given node. The context problem is solved structurally, not by hoping for larger context windows.

---

## Context Budget

The size of a context package is a quality signal. A package that grows too large indicates a node with too many dependencies, too broad a scope, or low cohesion — the same symptoms that indicate poor design in traditional software engineering.

`config.yaml` defines a soft threshold:

```yaml
limits:
  context_warning_tokens: 8000
```

`ygg build-context` reports the package size in its output footer. `ygg check` warns when any node's context package exceeds the threshold. The fix is always a graph-level change: split the node, reduce relations, or move cross-cutting concerns into aspects.

This makes architectural quality **measurable**. Instead of "I feel like this module is too big," the team sees: "this node's context is 14,000 tokens — twice the threshold." The number enforces discipline that is equivalent to the Single Responsibility Principle: if a node needs too much context to be understood, it is doing too much.
