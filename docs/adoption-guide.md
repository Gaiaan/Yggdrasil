# Adoption Guide

Yggdrasil adoption is incremental. Start with one module or one feature. Expand at your pace. Every increment provides value immediately.

## Greenfield: New Project

No existing code — the graph is the starting point.

### 1. Initialize

```bash
npm install -g @gaiaan/yggdrasil-cli
cd my-new-project
git init
ygg init --agent cursor
# After updating CLI: ygg init --agent cursor --commands-only (refreshes commands, keeps config)
```

This creates `.yggdrasil/` with a skeleton `config.yaml` and installs agent commands.

### 2. Configure globals

Edit `.yggdrasil/config.yaml`:

```yaml
name: "My SaaS Platform"
stack:
  language: TypeScript
  runtime: Node 22
  framework: NestJS
  database: PostgreSQL
  cache: Redis
standards:
  coding: "Clean Architecture, ESLint + Prettier"
  testing: "Jest, co-located spec files, 80% coverage target"
tags:
  requires-auth:
    description: "Requires authenticated user"
  public-api:
    description: "Public-facing endpoint"
    propagates: false
```

See [Building a Graph — config.yaml](/graph-guide#config-yaml) for the full field reference.

### 3. Define the graph

Create nodes manually or use `/ygg.define` conversationally:

1. Create top-level module nodes (auth, users, orders)
2. Add description artifacts to each module
3. Create child nodes for services, interfaces, models
4. Declare relations between nodes
5. Add detailed artifacts (constraints, business rules, diagrams) as needed

### 4. Materialize

```
/ygg.materialize
```

The agent resolves dependencies, builds context for each node, and generates code. Tests are generated alongside.

### 5. Iterate

Review the output. If something is wrong, refine the graph and rematerialize. Over time, the graph converges on the right level of detail.

### Workflow discipline

All graph changes follow the pipeline: **brief → clarify → plan → apply → materialize**. Do not jump straight to editing graph files or writing code. Start with `/ygg.brief` to capture the requirement, use `/ygg.plan` to propose changes, get approval, then `/ygg.apply` to write them to the graph. Only then materialize.

This prevents incomplete knowledge from entering the graph. See [Workflow](/workflow) for the full pipeline description.

## Brownfield: Existing Codebase

The more common and more valuable scenario. A team has an existing codebase and wants to use Yggdrasil for new changes or to describe existing modules.

### Approach 1: New features only

The simplest brownfield adoption:

1. Initialize Yggdrasil in the existing project
2. Leave existing code completely untouched
3. When a new feature is needed, create nodes in the graph for the new module(s)
4. Set relations to existing code conceptually (even if those modules are not in the graph)
5. Materialize the new module
6. New code lives alongside old code

The graph covers only new work. Old code is untouched. Over time, more of the system gets described in the graph.

### Approach 2: Ingest as blackbox

Use `/ygg.ingest` to bring existing code into the graph as documentation and context:

1. Run `/ygg.ingest` and point it at the module directory
2. The agent scans the code, identifies responsibilities, dependencies, and interfaces
3. Creates blackbox nodes grouped by responsibility (not one-per-class)
4. You review and approve
5. Graph provides context for future work

```yaml
# .yggdrasil/auth/node.yaml
name: Auth Module (existing)
type: module
blackbox: true
mapping:
  path: src/auth/
```

Blackbox nodes are:

- **Excluded from materialization** — `ygg resolve-deps` skips them
- **Excluded from context budget checks** — their purpose is context
- **Included in `ygg affected`** — interface changes flag dependents
- **Visible in `ygg tree`** — marked as `[blackbox]`

The graph becomes a **documentation and context layer** over existing code. New modules that depend on existing auth receive its interface description automatically.

### Approach 3: Progressive replacement

Over time, blackbox modules can graduate to graph-managed:

1. Describe a module as blackbox (Approach 2)
2. Refine artifacts until they precisely match existing behavior
3. Remove `blackbox: true` from `node.yaml`
4. Materialize — generated code replaces existing implementation
5. Run existing tests to verify equivalence
6. If tests pass, the module is now fully graph-managed

Risky — do module by module with thorough test coverage.

## Partial Coverage

The graph can describe 1% or 100% of the system:

```
Codebase:  [  auth  |  users  |  orders  |  payments  |  reports  ]
Graph:     [  auth  |  users  |          |  payments  |           ]
               ↑        ↑                     ↑
           described  described           described
           + mapped   + mapped            + new (materialized)
```

In this example:

- `auth` and `users` are described (documentation + context) but not materialized
- `payments` was created through the graph and materialized
- `orders` and `reports` are not in the graph at all
- The system works fine — `payments` can have relations to `auth` and `users` and receive their interface context

Undocumented code coexists peacefully. It simply does not participate in context building, dependency resolution, or drift detection.

## Integration with Existing Tools

### Git

Yggdrasil files live in the repository alongside code. Standard git workflow applies:

- Branches for features
- Pull requests for review
- Diffs to see what changed in the graph
- CI to run `ygg check` and `ygg drift`

No special git configuration needed.

### CI/CD

Add Yggdrasil checks to the pipeline:

```yaml
steps:
  - name: Install Yggdrasil
    run: npm install -g @gaiaan/yggdrasil-cli

  - name: Validate graph
    run: ygg check

  - name: Check for drift
    run: ygg drift
```

Fast, local operations. Add seconds to CI, not minutes.

### IDEs

The graph is plain files — YAML and markdown. Any editor works. No special IDE plugin is required.

### Monorepo / Multi-repo

The graph lives in one repository (the one containing `.yggdrasil/`). Mappings point to paths within the same repo:

```yaml
mapping:
  path: packages/orders/src/order.service.ts
```

For multi-repo setups, each repo can have its own `.yggdrasil/` graph. Cross-repo relations are not supported in the current model — each graph is self-contained.

## Effort Estimate

| Scenario | Effort | Time to First Value |
|---|---|---|
| **Greenfield, small project** | Low — define 5-10 nodes, materialize | Hours |
| **Greenfield, large project** | Medium — define modules, iterate on detail | Days |
| **Brownfield, new feature only** | Low — describe new module, materialize | Hours |
| **Brownfield, describe existing** | Medium — document existing modules | Days |
| **Brownfield, progressive replace** | High — describe + verify + materialize | Weeks per module |

**Recommended start:** One new feature through the graph. Define nodes, materialize, see the result. If it works, expand. If it does not, the investment was minimal.

## What Yggdrasil Does Not Require

- **Full coverage.** The graph can describe 1% or 100% of the system.
- **Team-wide adoption.** One person can use it for their work.
- **Workflow changes.** Git, PRs, CI — everything stays. Yggdrasil adds a layer, not replaces the stack.
- **Migration.** No code needs to be rewritten.
- **Specific AI agent.** Works with Cursor, Claude Code, Gemini CLI, or anything that reads markdown and runs shell commands.

---

**See also:** [Getting Started](/getting-started), [FAQ](/faq), [Materialization Specification](/spec/materialization)
