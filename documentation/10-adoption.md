# 10 — Adoption: Greenfield, Brownfield, and Everything In Between

## Principle: Adoption Must Be Incremental

Yggdrasil does not require a team to stop what they are doing, describe their entire system in a graph, and switch workflows overnight. Adoption is incremental:

- Start with one module, or one new feature.
- The rest of the codebase coexists untouched.
- Expand graph coverage at your own pace.
- Every increment provides value immediately.

---

## Greenfield: Starting a New Project

The simplest adoption path. There is no existing code — the graph is the starting point.

### Step 1: Initialize

```bash
npm install -g @yggdrasil/cli
cd my-new-project
git init
ygg init --agent claude
# After updating CLI: ygg init --agent claude --commands-only (refreshes commands, keeps config)
```

This creates `.yggdrasil/` with a skeleton `config.yaml` and installs agent commands.

### Step 2: Configure globals

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

### Step 3: Define the graph

The supervisor defines nodes — either manually (creating directories and files) or conversationally (using `/ygg.define`).

For a typical system:

1. Create top-level module nodes (auth, users, orders, etc.)
2. Add description artifacts to each module
3. Create child nodes for services, interfaces, models within each module
4. Declare relations between nodes
5. Add detailed artifacts (constraints, business rules, diagrams) as needed

### Step 4: Materialize

When the graph is detailed enough:

```
/ygg.materialize
```

The agent resolves dependencies, builds context for each node, and generates code. Tests are generated alongside.

### Step 5: Iterate

Review the output. If something is wrong, refine the graph and rematerialize. Over time, the graph converges on the right level of detail.

---

## Brownfield: Overlaying on Existing Code

The more common and more valuable scenario. A team has an existing codebase and wants to use Yggdrasil for new changes or to progressively describe existing modules.

### Approach 1: Graph for new features only

The simplest brownfield adoption:

1. Initialize Yggdrasil in the existing project
2. Leave existing code completely untouched
3. When a new feature is needed, create nodes in the graph for the new module(s)
4. Set relations to existing code conceptually (even if those modules are not in the graph)
5. Materialize the new module
6. New code lives alongside old code

The graph covers only new work. Old code is untouched. Over time, more of the system gets described in the graph.

### Approach 2: Ingest existing modules as blackbox

Use `/ygg.ingest` to bring existing code into the graph. The agent reads the code, analyzes its structure, and creates blackbox nodes that describe what exists:

1. Run `/ygg.ingest` and point it at the module directory
2. The agent scans the code, identifies responsibilities, dependencies, and interfaces
3. The agent proposes a graph structure: blackbox nodes grouped by responsibility (not one-per-class)
4. The supervisor reviews and approves
5. Nodes are created with `blackbox: true`, honest descriptions (including problems), and interface artifacts

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
- **Excluded from context budget checks** — their purpose is to provide context, not to be materialized
- **Included in `ygg affected`** — when a blackbox node's interface changes, dependents are flagged
- **Visible in `ygg tree`** — marked as `[blackbox]` for clarity

In this mode, the graph is a **documentation and context layer** over existing code. The blackbox node provides the same value as any other node for context building — new modules that depend on the existing auth system receive its interface description automatically.

### Approach 3: Progressive replacement

Over time, blackbox modules can graduate to graph-managed:

1. Describe a module as blackbox (Approach 2)
2. Refine the artifacts until they precisely match the existing behavior
3. Remove `blackbox: true` from `node.yaml`
4. Materialize — the generated code replaces the existing implementation
5. Run the existing tests to verify equivalence
6. If tests pass, the module is now fully graph-managed

This is risky and should be done module by module, with thorough test coverage.

---

## Partial Graph Coverage

Yggdrasil works with any level of graph coverage:

```
Codebase:  [  auth  |  users  |  orders  |  payments  |  reports  ]
Graph:     [  auth  |  users  |          |  payments  |           ]
                ↑        ↑                     ↑
            described  described           described
            + mapped   + mapped            + new (materialized)
```

In this example:

- `auth` and `users` are described in the graph (documentation + context) but not materialized
- `payments` was created through the graph and materialized
- `orders` and `reports` are not in the graph at all
- The system works fine — `payments` can have relations to `auth` and `users` and receive their interface context during materialization

Nodes outside the graph simply do not participate in context building, dependency resolution, or drift detection. They coexist peacefully.

---

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
    run: npm install -g @yggdrasil/cli

  - name: Validate graph
    run: ygg check

  - name: Check for drift
    run: ygg drift
```

These are fast, local operations. They add seconds to CI, not minutes.

### IDEs

The graph is plain files — YAML and markdown. Any editor works. No special IDE plugin is required (though one could be built for visualization).

Agent commands are installed for the user's AI agent. The agent uses the graph through the CLI. The IDE is just the environment where the agent runs.

### Monorepo / Multi-repo

The graph lives in one repository (the one containing `.yggdrasil/`). Mappings can point to paths within the same repo:

```yaml
# Monorepo
mapping:
  path: packages/orders/src/order.service.ts
```

For multi-repo setups, each repo can have its own `.yggdrasil/` graph describing its portion of the system. Cross-repo relations are not supported in the current model — each graph is self-contained.

---

## Effort and Time to Value

| Scenario | Effort | Time to First Value |
|---|---|---|
| **Greenfield, small project** | Low — define 5-10 nodes, materialize | Hours |
| **Greenfield, large project** | Medium — define modules, iterate on detail | Days |
| **Brownfield, new feature only** | Low — describe new module, materialize | Hours |
| **Brownfield, describe existing** | Medium — document existing modules | Days (value: living docs + context) |
| **Brownfield, progressive replace** | High — describe + verify + materialize | Weeks per module |

The recommended starting point for any team: **one new feature through the graph**. Define nodes, materialize, see the result. If it works, expand. If it does not, the investment was minimal.

---

## What Yggdrasil Does Not Require

- **Full coverage.** The graph can describe 1% or 100% of the system.
- **Team-wide adoption.** One person can use it for their work.
- **Workflow changes.** Git, PRs, CI — everything stays the same. Yggdrasil adds a layer, it does not replace the stack.
- **Migration.** No code needs to be rewritten. No architecture needs to change.
- **Specific AI agent.** Works with Cursor, Claude Code, Gemini CLI, or anything that can read markdown and run shell commands.
