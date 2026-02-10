# 03 — Graph Structure: Directories, Nodes, Artifacts, Configuration

## The Graph Is a Directory Tree

The Yggdrasil graph is not stored in a database or a single configuration file. It is a **directory hierarchy** inside the `yggdrasil/` folder at the project root. The structure of directories *is* the graph.

```
project-root/
└── yggdrasil/
    ├── config.yaml              # Global configuration
    ├── aspects/                 # Cross-cutting concern definitions
    │   ├── audit-logging.yaml
    │   └── rate-limiting.yaml
    │
    ├── auth/                    # Node: Auth module
    │   ├── node.yaml            # Node metadata
    │   ├── overview.md          # Artifact: textual description
    │   ├── security-policy.md   # Artifact: security rules
    │   ├── integration.md       # Artifact: integration diagram
    │   │
    │   ├── login-service/       # Child node: LoginService
    │   │   ├── node.yaml
    │   │   ├── description.md
    │   │   └── sequence.md
    │   │
    │   ├── session-manager/     # Child node: SessionManager
    │   │   ├── node.yaml
    │   │   └── description.md
    │   │
    │   └── auth-api/            # Child node: AuthAPI
    │       ├── node.yaml
    │       └── openapi.yaml     # Artifact: API contract
    │
    ├── users/                   # Node: Users module
    │   ├── node.yaml
    │   ├── description.md
    │   └── user-repository/
    │       ├── node.yaml
    │       └── description.md
    │
    └── orders/                  # Node: Orders module
        ├── node.yaml
        ├── description.md
        ├── business-rules.md
        └── order-service/
            ├── node.yaml
            ├── description.md
            └── state-machine.md
```

### Rules

1. **A directory is a node** if and only if it contains a `node.yaml` file.
2. **Parent-child** relationships are defined by directory nesting. `auth/login-service/` means LoginService is a child of Auth.
3. **Artifacts** are all files in a node's directory that are not `node.yaml` and not child directories. Any file format is allowed.
4. **Depth is unlimited.** The hierarchy can be as shallow or deep as the supervisor needs.
5. **The `aspects/` directory** is reserved for aspect definitions. It is not a node.
6. **The `flows/` directory** is reserved for flow definitions. It is not a node.
7. **The `.briefs/` directory** (if present) stores brief files. It is not a node.

---

## Node Metadata: `node.yaml`

The `node.yaml` file contains **structural metadata only** — the information needed to build the graph, resolve dependencies, and connect nodes. It does not contain descriptions, constraints, interfaces, or business rules. Those belong in artifacts.

### Schema

```yaml
# Required
name: OrderService          # Human-readable name
type: service               # Semantic type (open set, see below)

# Optional
tags:                        # List of tag identifiers
  - requires-auth
  - requires-audit

relations:                   # Dependencies on other nodes
  - target: auth/auth-api    # Path relative to yggdrasil/
    type: uses               # Relation type (open set)
  - target: payments/payment-service
    type: calls
  - target: products/product-catalog
    type: reads

mapping:                     # Where the generated code lives
  path: src/modules/orders/order.service.ts

blackbox: false              # Default. Set true for existing code described
                             # for context only (not materialized, skips checks)
```

### Fields

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Human-readable name of the node. Used in context packages and visualizations. |
| `type` | Yes | Semantic type. Open set — the supervisor defines types meaningful to their system. |
| `tags` | No | List of tag identifiers. Must match tags defined in `config.yaml`. |
| `relations` | No | List of declared dependencies on other nodes. |
| `relations[].target` | Yes (per relation) | Path to the target node, relative to `yggdrasil/`. |
| `relations[].type` | Yes (per relation) | Semantic type of the relation (e.g., `uses`, `calls`, `reads`, `implements`). Open set. |
| `mapping` | No | Where the materialized code lives. Used by drift detection. |
| `mapping.path` | Yes (if mapping present) | File path, directory path, or a list of paths, relative to the project root. When a node produces multiple files, use a YAML list. |
| `blackbox` | No | If `true`, the node describes existing code for context purposes only. It is excluded from materialization, context budget checks, and `resolve-deps` stages. Other nodes can still relate to it and receive its artifacts. Default: `false`. |

#### Multi-file mapping

When a node produces multiple files — for example, a framework-convention page that requires `page.tsx`, `loading.tsx`, and a feature component — use a list:

```yaml
mapping:
  path:
    - app/shop/page.tsx
    - app/shop/loading.tsx
    - src/features/shop/ProductListingPage.tsx
```

The agent creates all listed files during materialization. Drift detection tracks each file independently. Which files to produce and what each should contain is typically described in an aspect bound to the node's tag (e.g., a `page` aspect describing Next.js App Router conventions).

### Node Types

The `type` field is an **open set**. Yggdrasil does not prescribe types. Common examples:

| Type | Typical Use |
|---|---|
| `module` | Logical grouping of functionality |
| `service` | A service with business logic |
| `component` | A component within a module |
| `interface` | A contract specification (API, protocol) |
| `model` | A data model or entity |
| `function` | A single function or operation |
| `config` | A configuration element |
| `test` | A test suite or test specification |

The supervisor can define any type that makes sense. `type` is metadata for humans and for agents building context — it has no behavioral implications in the CLI.

### Relation Types

Like node types, relation types are an **open set**. The supervisor defines what makes sense. Common examples:

| Type | Meaning |
|---|---|
| `uses` | General dependency |
| `calls` | Invokes at runtime |
| `reads` | Reads data from |
| `implements` | Implements a contract defined by the target |
| `extends` | Extends or inherits from |
| `publishes` | Publishes events consumed by the target |
| `subscribes` | Subscribes to events from the target |

---

## Artifacts

Artifacts are the **substance** of a node. While `node.yaml` provides structural metadata, artifacts provide the actual content that informs materialization: what the node does, how it works, what constraints it has, what interface it exposes.

### What qualifies as an artifact

Any file in the node's directory that is not `node.yaml` and is not a child node directory. Examples:

| File | Content |
|---|---|
| `description.md` | What the node does, why it exists, responsibilities |
| `constraints.md` | Performance limits, business rules, validation rules |
| `interface.yaml` | Exported functions, events, API endpoints |
| `business-rules.md` | Formalized business logic |
| `sequence-diagram.md` | Mermaid or PlantUML sequence diagram |
| `integration-diagram.md` | How child nodes interact |
| `openapi.yaml` | OpenAPI specification |
| `notes.md` | Informal notes, decisions, rationale |
| `examples.md` | Usage examples, edge cases |

### No prescribed format

Yggdrasil does not dictate artifact names, formats, or structure. A node might have one artifact (`description.md`) or twenty. The supervisor decides what level of detail is needed.

The only requirement: artifacts should be in formats that an AI agent can read and understand. Markdown, YAML, plain text, Mermaid diagrams — all work well. Binary formats (images, PDFs) can exist but will not be included in context packages.

### How artifacts are used

When the CLI builds a context package for a node (`ygg build-context`), it reads **all text-based artifacts** from the node's directory and includes them in the package. The agent materializing the node sees every artifact as part of its context.

This means: the richer and more precise the artifacts, the better the materialized code. Adding a constraint file makes the agent respect that constraint. Adding a sequence diagram makes the agent follow that flow. The graph self-calibrates through artifact quality.

---

## Node Placement

Nodes belong in the module that **owns their domain concept**, not in the module that provides their technical foundation.

### Domain-specific vs. generic

- **Domain-specific** components live in their domain module. A `ProductCard` component belongs in `shop/product-card/`, not `ui/product-card/` — it represents a shop concept, not a generic UI element. A relation `→ ui/` gives it access to design guidelines without relocating it.
- **Generic/reusable** components live in a shared module. A custom `DataTable` with specialized behavior belongs in `ui/data-table/` — it serves multiple domains.
- **Relations provide cross-domain context.** A domain node with a relation to a shared module receives that module's artifacts in its context package. The node does not need to live inside the shared module to benefit from its context.

### When to promote

A component starts in its domain. If a second domain needs the same component, that is a signal to move it to the shared module: delete the domain-specific node, create a shared node, update relations in both domains. This is a graph refactoring — code follows via rematerialization.

---

## Global Configuration: `config.yaml`

The `config.yaml` file at the root of `yggdrasil/` defines project-wide settings that apply to all nodes.

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
  context_warning_tokens: 8000     # ygg check warns when a context package exceeds this

tags:
  requires-auth:
    description: "Node requires authentication"
    propagates: false
  requires-audit:
    description: "Operations must be logged to audit trail"
    propagates: true
  server-only:
    description: "Server-side rendering only, no client JS"
    propagates: false
    conflicts_with: [client-interactive]
  client-interactive:
    description: "Client-side interactive component with state"
    propagates: false
    conflicts_with: [server-only]
```

### Fields

| Field | Description |
|---|---|
| `name` | Project name |
| `stack` | Technology stack. Free-form — whatever is relevant. Included in every context package. |
| `standards` | Coding standards, testing conventions, naming rules. Included in every context package. |
| `limits` | Optional limits for quality signals. |
| `limits.context_warning_tokens` | Soft threshold for context package size. `ygg check` warns when a node's context exceeds this. Default: `8000`. |
| `tags` | Tag definitions. Each tag has a `description` and optional `propagates` and `conflicts_with` flags. |
| `tags[].propagates` | If `true`, a parent node's tag automatically applies to all children. Default: `false`. |
| `tags[].conflicts_with` | List of tag identifiers that conflict with this tag. `ygg check` reports an error if a node carries both. |

The `config.yaml` content forms the **top layer** of every context package. Every agent materializing any node sees these global settings.

---

## Aspects: `yggdrasil/aspects/`

Aspects define cross-cutting concerns — behaviors or requirements that apply to many nodes across the hierarchy, identified by tags.

### Aspect file format

```yaml
# yggdrasil/aspects/audit-logging.yaml

name: Audit Logging
tag: requires-audit

description: |
  Every data-modifying operation must be logged to the audit_log table.
  Log entry format: { userId, action, entityType, entityId, oldState, newState, timestamp }.
  Audit log write must be transactional with the operation itself.

requirements:
  - "Use AuditService.log() for all create, update, and delete operations"
  - "Never log sensitive fields (passwords, tokens) in oldState/newState"
  - "Audit log entries are append-only, never modified or deleted"
```

An aspect can also provide **materialization guidance** — instructions that tell the agent how to produce files, not just what the code should do:

```yaml
# yggdrasil/aspects/next-js-page.yaml

name: Next.js App Router Page
tag: page

description: |
  Nodes tagged `page` represent a Next.js App Router route.
  Materialization must produce all files required by App Router conventions:
  page.tsx (entry point, Server Component), loading.tsx (Suspense skeleton),
  and optionally layout.tsx (if auth or shared layout needed).
  All paths listed in the node's mapping must be created.
```

### How aspects work

1. A tag is defined in `config.yaml` (e.g., `requires-audit`).
2. An aspect file in `aspects/` declares which tag it binds to (`tag: requires-audit`).
3. Nodes that carry the tag in their `node.yaml` are linked to the aspect.
4. When `build-context` runs for such a node, the aspect's content is **injected into the context package**.
5. The agent materializing the node sees the aspect requirements and implements accordingly.

Aspects can describe both **requirements** (what the code must do) and **materialization guidance** (how the agent should produce files). For example, a `next-js-page` aspect bound to tag `page` can instruct the agent to produce `page.tsx`, `loading.tsx`, and `layout.tsx` as part of materializing a single node. The guidance is natural language — no separate template mechanism is needed. The node's own artifacts or description can also include such instructions (e.g., "Always update `routes.ts` when adding this page").

### Aspects are not inherited through relations

An aspect applies to a node because **the node carries the tag**, not because a related node carries it. If `OrderService` has tag `requires-audit`, it gets the audit aspect. If `PaymentService` is related to `OrderService` but does not carry the tag, it does not get the aspect.

Tag propagation (from `config.yaml`) works along the **parent-child** axis only: if a parent node has a propagating tag, its children inherit it.

---

## Flows: `yggdrasil/flows/`

Flows describe end-to-end processes that span multiple nodes across modules. While aspects define cross-cutting concerns (what applies *across* nodes by tag) and relations define bilateral dependencies (A uses B), flows define how multiple nodes collaborate in a process (user goes through A → B → C → D).

### Flow directory structure

Each flow is a directory inside `yggdrasil/flows/` containing a `flow.yaml` metadata file and artifact files:

```
yggdrasil/flows/
├── checkout-flow/
│   ├── flow.yaml              # Metadata: name, participating nodes
│   ├── description.md         # What the flow does, happy path, error paths
│   └── sequence.md            # Mermaid sequence diagram
│
├── user-registration/
│   ├── flow.yaml
│   └── description.md
```

### `flow.yaml` schema

```yaml
# yggdrasil/flows/checkout-flow/flow.yaml

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
| `nodes` | Yes | List of participating node paths (relative to `yggdrasil/`). |

### Flow artifacts

Artifacts in the flow directory describe the process:

| File | Content |
|---|---|
| `description.md` | Happy path, error paths, edge cases, timeouts |
| `sequence.md` | Sequence diagram (Mermaid, PlantUML) showing node interactions |
| `error-handling.md` | What happens when each step fails |
| `performance.md` | Latency requirements, SLAs for the end-to-end flow |

Artifacts are free-form — the supervisor decides what level of detail is needed.

### How flows work

1. A flow directory is created in `yggdrasil/flows/`.
2. `flow.yaml` declares which nodes participate in the flow.
3. Artifacts in the flow directory describe the process.
4. When `build-context` runs for a participating node, the flow's artifacts are **included in the context package**.
5. The agent materializing the node knows which end-to-end process it belongs to and how it fits with other participating nodes.

### When to create flows

Create a flow when a process spans **3+ nodes across 2+ modules**. Simpler interactions between two nodes are adequately described by relations and parent module artifacts.

### Flows are not dependency chains

A flow describes a process, not a build order. The `nodes` list is not ordered — the order of the process is described in the flow's artifacts (description, sequence diagram). Dependency order for materialization is still determined by `relations` in `node.yaml`, not by flow membership.

---

## Putting It All Together: Example

```
yggdrasil/
├── config.yaml                          # Stack: TS, NestJS, PG; Tags defined
├── aspects/
│   ├── audit-logging.yaml               # Binds to tag: requires-audit
│   └── rate-limiting.yaml               # Binds to tag: public-api
├── flows/
│   └── checkout-flow/                   # End-to-end: cart → payment → order
│       ├── flow.yaml                    # nodes: [orders/order-service, ...]
│       └── sequence.md                  # Mermaid sequence diagram
│
├── auth/
│   ├── node.yaml                        # type: module, tags: [requires-audit]
│   ├── overview.md                      # "Auth module handles authentication..."
│   ├── security-policy.md               # "JWT tokens, bcrypt, rate limiting..."
│   │
│   ├── login-service/
│   │   ├── node.yaml                    # type: service, relations: [→ users/user-repo]
│   │   ├── description.md               # "Validates credentials, issues tokens..."
│   │   └── sequence.md                  # Mermaid diagram of login flow
│   │
│   └── auth-api/
│       ├── node.yaml                    # type: interface, tags: [public-api]
│       └── openapi.yaml                 # Full OpenAPI spec
│
└── orders/
    ├── node.yaml                        # type: module, tags: [requires-audit]
    ├── description.md                   # "Order management module..."
    ├── business-rules.md                # "Min order 10 PLN, max 50 items..."
    │
    └── order-service/
        ├── node.yaml                    # type: service, tags: [requires-auth, requires-audit]
        │                                # relations: [→ auth/auth-api, → payments/...]
        ├── description.md               # "Manages order lifecycle..."
        └── state-machine.md             # "Draft → Submitted → Processing → Completed"
```

When `ygg build-context orders/order-service` runs, it assembles:

1. **Global**: `config.yaml` content (TS, NestJS, PostgreSQL, standards)
2. **Hierarchy**: `orders/` artifacts (description.md, business-rules.md)
3. **Own**: `orders/order-service/` artifacts (description.md, state-machine.md)
4. **Relations**: interface artifacts from `auth/auth-api/` (openapi.yaml), `payments/...`
5. **Aspects**: audit-logging.yaml (because node has tag `requires-audit`), plus the node inherits `requires-audit` aspect context
6. **Flows**: checkout-flow/ artifacts (sequence.md) — because the node is listed in `flows/checkout-flow/flow.yaml`

One document. Everything the agent needs. Nothing it does not.
