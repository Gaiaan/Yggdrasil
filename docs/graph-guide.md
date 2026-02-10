# Building a Graph

A practical guide to creating and organizing your Yggdrasil graph. See [Core Concepts](/concepts) for terminology.

## Directory Structure

The graph is a directory tree. Each directory with a `node.yaml` is a node:

```
project-root/
└── yggdrasil/
    ├── config.yaml
    ├── aspects/
    ├── flows/
    ├── auth/
    │   ├── node.yaml
    │   ├── overview.md
    │   ├── login-service/
    │   │   ├── node.yaml
    │   │   └── description.md
    │   └── auth-api/
    │       ├── node.yaml
    │       └── openapi.yaml
    └── orders/
        ├── node.yaml
        ├── description.md
        └── order-service/
            ├── node.yaml
            ├── description.md
            └── state-machine.md
```

## Writing node.yaml

Required fields: `name` and `type`. Everything else is optional.

```yaml
name: OrderService
type: service

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

blackbox: false # true for existing code described only for context
```

### Multi-file mapping

For nodes that produce multiple files (e.g., Next.js pages):

```yaml
mapping:
  path:
    - app/shop/page.tsx
    - app/shop/loading.tsx
    - src/features/shop/ProductListingPage.tsx
```

### Common types

| Type        | Use                    |
| ----------- | ---------------------- |
| `module`    | Logical grouping       |
| `service`   | Business logic         |
| `component` | UI or domain component |
| `interface` | API contract, protocol |
| `model`     | Data entity            |

Types are an open set — define what fits your system.

## Writing Artifacts

Artifacts are free-form. Common choices:

| File                | Purpose                              |
| ------------------- | ------------------------------------ |
| `description.md`    | What the node does, responsibilities |
| `constraints.md`    | Limits, validation rules             |
| `interface.yaml`    | Exported functions, endpoints        |
| `business-rules.md` | Domain logic                         |
| `sequence.md`       | Mermaid or PlantUML diagrams         |

The more precise the artifacts, the better the materialized code.

## config.yaml

Global settings at `yggdrasil/config.yaml`:

```yaml
name: "My E-Commerce System"

stack:
  language: TypeScript
  framework: NestJS
  database: PostgreSQL

standards:
  coding: "ESLint + Prettier, Clean Architecture"
  testing: "Jest, 80% coverage"

limits:
  context_warning_tokens: 8000

tags:
  requires-auth:
    description: "Requires authenticated user"
    propagates: false
  requires-audit:
    description: "Operations must be logged"
    propagates: true
  server-only:
    conflicts_with: [client-interactive]
```

## Tags and Aspects

1. Define tags in `config.yaml`
2. Create aspect files in `yggdrasil/aspects/` that bind to tags:

```yaml
# yggdrasil/aspects/audit-logging.yaml
name: Audit Logging
tag: requires-audit

description: |
  Every data-modifying operation must be logged to the audit_log table.
  Use AuditService.log() for all create, update, delete.
```

1. Add tags to nodes in `node.yaml`
2. When building context, matching aspects are injected automatically

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

Relation types (`uses`, `calls`, `reads`, `implements`, etc.) are an open set. Relations provide interface context and define materialization order.

## Flows

For processes spanning 3+ nodes across 2+ modules. Create `yggdrasil/flows/<flow-name>/`:

**flow.yaml:**

```yaml
name: Checkout Flow
nodes:
  - shop/checkout/
  - payments/stripe-checkout/
  - data/orders/
  - shop/order-confirmation/
```

Add `description.md`, `sequence.md` (Mermaid) as needed. Flow artifacts are included in context for all participating nodes.

---

**Next:** [Workflow](/workflow) — from brief to materialization.
