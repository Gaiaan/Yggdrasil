# Getting Started

Get up and running with Yggdrasil in about 5 minutes.

## 1. Install the CLI

```bash
npm install -g @gaiaan/yggdrasil-cli
```

Requires Node.js 22+. See [Installation](/installation) for detailed setup.

## 2. Initialize

```bash
cd my-project
ygg init --agent cursor
```

This creates the `yggdrasil/` directory and installs agent commands for your AI assistant. Choose `claude`, `cursor`, `copilot`, or `gemini` for `--agent`.

## 3. Configure

Edit `yggdrasil/config.yaml` to set your project name, tech stack, and coding standards:

```yaml
name: "My E-Commerce System"

stack:
  language: TypeScript
  runtime: Node 22
  framework: NestJS
  database: PostgreSQL

standards:
  coding: "ESLint + Prettier, Clean Architecture"
  testing: "Jest, 80% coverage target"
```

## 4. Create Your First Node

Create a node directory with metadata and description:

```bash
mkdir -p yggdrasil/orders/order-service
```

**yggdrasil/orders/order-service/node.yaml:**

```yaml
name: OrderService
type: service
tags:
  - requires-auth
relations:
  - target: auth/auth-api
    type: uses
mapping:
  path: src/modules/orders/order.service.ts
```

**yggdrasil/orders/order-service/description.md:**

```markdown
# OrderService

Manages order lifecycle: create, update, cancel. Validates business rules
(min order amount, max items). Integrates with auth for user context.
```

## 5. Build Context

```bash
ygg build-context orders/order-service
```

This outputs a complete context package — everything an AI agent needs to materialize this node. Pipe it to your agent or use `/ygg.materialize`.

## 6. Validate the Graph

```bash
ygg check
```

Ensures relations point to existing nodes, tags are defined, and the graph is structurally consistent.

---

**Next steps:** Read [Core Concepts](/concepts) to understand the graph model, or jump to [Workflow](/workflow) to see the full pipeline from requirements to code.
