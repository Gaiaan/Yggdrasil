# Building a Graph

A practical guide to creating and organizing your Yggdrasil graph. See [Core Concepts](/concepts) for terminology.

## Directory Structure

The graph is a directory tree inside `.yggdrasil/`. Each directory with a `node.yaml` is a node:

```
project-root/
  .yggdrasil/
    config.yaml
    aspects/
    flows/
    .briefs/
    auth/
      node.yaml
      overview.md
      security-policy.md
      login-service/
        node.yaml
        description.md
        sequence.md
      auth-api/
        node.yaml
        openapi.yaml
    orders/
      node.yaml
      description.md
      business-rules.md
      order-service/
        node.yaml
        description.md
        state-machine.md
```

### Rules

1. **A directory is a node** if and only if it contains a `node.yaml` file.
2. **Parent-child** relationships are defined by directory nesting. `auth/login-service/` means LoginService is a child of Auth.
3. **Artifacts** are all files in a node's directory that are not `node.yaml` and not child directories. Any file format is allowed.
4. **Depth is unlimited.** The hierarchy can be as shallow or deep as the supervisor needs.
5. **The `aspects/` directory** is reserved for aspect definitions. It is not a node.
6. **The `flows/` directory** is reserved for flow definitions. It is not a node.
7. **The `.briefs/` directory** (if present) stores brief files. It is not a node.

## Writing node.yaml

The `node.yaml` file contains **structural metadata only** — information for building the graph, resolving dependencies, and connecting nodes. Descriptions, constraints, and business rules belong in artifacts.

### Schema

```yaml
# Required
name: OrderService
type: service

# Optional
tags:
  - requires-auth
  - requires-audit

relations:
  - target: auth/auth-api
    type: uses
  - target: payments/payment-service
    type: calls

mapping:
  path: src/modules/orders/order.service.ts

blackbox: false   # true for existing code described only for context
```

### Full field reference

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Human-readable name. Used in context packages and visualizations. |
| `type` | Yes | Semantic type. Open set — define types meaningful to your system. |
| `tags` | No | List of tag identifiers. Must match tags defined in `config.yaml`. |
| `relations` | No | List of declared dependencies on other nodes. |
| `relations[].target` | Yes (per relation) | Path to the target node, relative to `.yggdrasil/`. |
| `relations[].type` | Yes (per relation) | Semantic type of the relation (e.g., `uses`, `calls`, `reads`). Open set. |
| `mapping` | No | Where the materialized code lives. Used by drift detection. |
| `mapping.path` | Yes (if mapping) | File path, directory path, or a YAML list of paths, relative to project root. |
| `blackbox` | No | If `true`, node describes existing code for context only. Excluded from materialization, context budget checks, and `resolve-deps` stages. Other nodes can still relate to it. Default: `false`. |

### Multi-file mapping

When a node produces multiple files — for example, a framework-convention page that requires `page.tsx`, `loading.tsx`, and a feature component — use a list:

```yaml
mapping:
  path:
    - app/shop/page.tsx
    - app/shop/loading.tsx
    - src/features/shop/ProductListingPage.tsx
```

The agent creates all listed files during materialization. Drift detection tracks each file independently. Which files to produce is typically described in an aspect bound to the node's tag.

### Node types

The `type` field is an **open set** — define what fits your system:

| Type | Typical Use |
|---|---|
| `module` | Logical grouping of functionality |
| `service` | A service with business logic |
| `component` | UI or domain component |
| `interface` | A contract specification (API, protocol) |
| `model` | A data model or entity |
| `function` | A single function or operation |
| `config` | A configuration element |
| `test` | A test suite or test specification |

The `type` field is metadata for humans and agents — it has no behavioral implications in the CLI.

### Relation types

Like node types, relation types are an **open set**:

| Type | Meaning |
|---|---|
| `uses` | General dependency |
| `calls` | Invokes at runtime |
| `reads` | Reads data from |
| `implements` | Implements a contract defined by the target |
| `extends` | Extends or inherits from |
| `publishes` | Publishes events consumed by the target |
| `subscribes` | Subscribes to events from the target |

## Writing Artifacts

Artifacts are the **substance** of a node. While `node.yaml` provides structure, artifacts provide the content that informs materialization.

### What qualifies as an artifact

Any file in the node's directory that is not `node.yaml` and is not a child node directory:

| File | Content |
|---|---|
| `description.md` | What the node does, why it exists, responsibilities |
| `constraints.md` | Performance limits, business rules, validation rules |
| `interface.yaml` | Exported functions, events, API endpoints |
| `business-rules.md` | Formalized business logic |
| `sequence-diagram.md` | Mermaid or PlantUML sequence diagram |
| `openapi.yaml` | OpenAPI specification |
| `notes.md` | Informal notes, decisions, rationale |
| `examples.md` | Usage examples, edge cases |

### No prescribed format

Yggdrasil does not dictate artifact names, formats, or structure. The only requirement: artifacts should be in formats that an AI agent can read (markdown, YAML, plain text, Mermaid). Binary formats (images, PDFs) can exist but will not be included in context packages.

Artifacts must contain **complete, concrete knowledge** — not vague suggestions. Code is derived from the graph; if an artifact says "handle errors appropriately" instead of specifying which errors and how, materialization will produce inconsistent code. Write the full detail: constraints, edge cases, interfaces, business rules. See [Core Concepts — The graph holds complete knowledge](/concepts#the-graph-holds-complete-knowledge).

## config.yaml

Global settings at `.yggdrasil/config.yaml` — included in **every** context package:

```yaml
name: "My E-Commerce System"

stack:
  language: TypeScript
  runtime: Node 22
  framework: NestJS
  database: PostgreSQL
  cache: Redis

standards:
  coding: |
    ESLint + Prettier configuration.
    Clean Architecture pattern.
    camelCase for functions, PascalCase for classes.
  testing: |
    Jest as test framework.
    Test coverage target: 80%.
    Co-locate test files with source (*.spec.ts).

limits:
  context_warning_tokens: 8000

tags:
  requires-auth:
    description: "Node requires authentication"
    propagates: false
  requires-audit:
    description: "Operations must be logged to audit trail"
    propagates: true
  server-only:
    description: "Server-side rendering only"
    propagates: false
    conflicts_with: [client-interactive]
  client-interactive:
    description: "Client-side interactive component"
    propagates: false
    conflicts_with: [server-only]
```

### Config field reference

| Field | Description |
|---|---|
| `name` | Project name |
| `stack` | Technology stack. Free-form. Included in every context package. |
| `standards` | Coding standards, testing conventions. Included in every context package. |
| `limits` | Optional limits for quality signals. |
| `limits.context_warning_tokens` | Soft threshold for context package size. `ygg check` warns when exceeded. Default: `8000`. |
| `tags` | Tag definitions. Each with `description` and optional `propagates` and `conflicts_with`. |
| `tags[].propagates` | If `true`, parent's tag auto-applies to all children. Default: `false`. |
| `tags[].conflicts_with` | List of conflicting tags. `ygg check` reports error if a node carries both. |

## Tags and Aspects

Aspects define cross-cutting concerns — behaviors that apply to many nodes, identified by tags.

### Step by step

1. Define tags in `config.yaml`
2. Create aspect files in `.yggdrasil/aspects/` that bind to tags
3. Add tags to nodes in `node.yaml`
4. When building context, matching aspects are injected automatically

### Aspect file format

```yaml
# .yggdrasil/aspects/audit-logging.yaml
name: Audit Logging
tag: requires-audit

description: |
  Every data-modifying operation must be logged to the audit_log table.
  Log entry format: { userId, action, entityType, entityId, oldState, newState, timestamp }.
  Audit log write must be transactional with the operation itself.

requirements:
  - "Use AuditService.log() for all create, update, delete operations"
  - "Never log sensitive fields (passwords, tokens) in oldState/newState"
  - "Audit log entries are append-only, never modified or deleted"
```

Aspects can also provide **materialization guidance** — instructions on how the agent should produce files:

```yaml
# .yggdrasil/aspects/next-js-page.yaml
name: Next.js App Router Page
tag: page

description: |
  Nodes tagged `page` represent a Next.js App Router route.
  Materialization must produce: page.tsx (Server Component),
  loading.tsx (Suspense skeleton), and optionally layout.tsx.
  All paths listed in the node's mapping must be created.
```

### How aspects bind

- An aspect applies because **the node carries the tag**, not because a related node carries it.
- Tag propagation (from `config.yaml`) works along the **parent-child** axis only.
- Aspects are **not** inherited through relations.

## Relations

Declare dependencies between nodes that are not parent-child:

```yaml
relations:
  - target: auth/auth-api
    type: uses
  - target: payments/payment-service
    type: calls
  - target: products/product-catalog
    type: reads
```

Relations serve three purposes:

1. **Context enrichment** — interface artifacts from related nodes are included in the context package.
2. **Dependency ordering** — defines which nodes must be materialized first.
3. **Change propagation** — when a related node's interface changes, dependents are flagged.

## Flows

For processes spanning 3+ nodes across 2+ modules. Create `.yggdrasil/flows/<flow-name>/`:

### flow.yaml schema

```yaml
name: Checkout Flow
nodes:
  - shop/checkout/
  - payments/stripe-checkout/
  - payments/stripe-webhooks/
  - data/orders/
  - shop/order-confirmation/
```

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Human-readable name of the flow. |
| `nodes` | Yes | List of participating node paths (relative to `.yggdrasil/`). |

### Flow artifacts

| File | Content |
|---|---|
| `description.md` | Happy path, error paths, edge cases, timeouts |
| `sequence.md` | Sequence diagram showing node interactions |
| `error-handling.md` | What happens when each step fails |
| `performance.md` | Latency requirements, SLAs |

### When to create flows

Create a flow when a process spans **3+ nodes across 2+ modules**. Simpler two-node interactions are adequately described by relations and parent module artifacts.

### Flows vs. relations

A flow describes a **process**, not a build order. The `nodes` list is not ordered — the process order is described in the flow's artifacts. Dependency order for materialization is determined by `relations`, not by flow membership.

## Node Placement

Nodes belong in the module that **owns their domain concept**, not in the module that provides their technical foundation.

### Domain-specific vs. generic

- **Domain-specific** components live in their domain module. A `ProductCard` belongs in `shop/product-card/`, not `ui/product-card/` — it represents a shop concept. A relation `→ ui/` gives it access to design guidelines without relocating it.
- **Generic/reusable** components live in a shared module. A custom `DataTable` with specialized behavior belongs in `ui/data-table/` — it serves multiple domains.
- **Relations provide cross-domain context.** A domain node with a relation to a shared module receives that module's artifacts in its context package.

### When to promote

A component starts in its domain. If a second domain needs the same component, move it to a shared module: delete the domain-specific node, create a shared node, update relations. This is a graph refactoring — code follows via rematerialization.

---

**Want to understand how context is assembled from the graph?** Read the [Context Builder Specification](/spec/context-builder).

**Next:** [Workflow](/workflow) — from brief to materialization.
