# Adoption Guide

Yggdrasil adoption is incremental. Start with one module or one feature. Expand at your pace.

## Greenfield: New Project

No existing code — the graph is the starting point.

### 1. Initialize

```bash
npm install -g @gaiaan/yggdrasil-cli
cd my-new-project
git init
ygg init --agent cursor
```

### 2. Configure

Edit `yggdrasil/config.yaml` — name, stack, standards, tags. See [Building a Graph](/graph-guide#config-yaml).

### 3. Define the Graph

Create nodes manually or use `/ygg.define` conversationally:

- Top-level modules (auth, users, orders)
- Child nodes (services, interfaces, models)
- Relations between nodes
- Artifacts (descriptions, constraints, diagrams)

### 4. Materialize

```
/ygg.materialize
```

### 5. Iterate

If output is wrong, refine the graph and rematerialize. Don't edit generated code.

## Brownfield: Existing Codebase

### Approach 1: New Features Only

1. Initialize Yggdrasil in the project
2. Leave existing code untouched
3. For new features, create nodes in the graph
4. Set relations (conceptual links to undocumented modules)
5. Materialize new modules
6. New code lives alongside old

### Approach 2: Ingest as Blackbox

Use `/ygg.ingest` to document existing code:

1. Point the agent at a module directory
2. Agent analyzes code, groups by responsibility
3. Creates blackbox nodes with honest descriptions (including problems)
4. You review and approve
5. Graph provides context for future work

Blackbox nodes are excluded from materialization but included in context building.

### Approach 3: Progressive Replacement

1. Ingest a module as blackbox
2. Refine artifacts until they match existing behavior
3. Remove `blackbox: true`
4. Materialize — generated code replaces existing
5. Run tests to verify equivalence

Risky — do module by module with strong test coverage.

## Partial Coverage

The graph can describe 1% or 100% of the system. Undocumented code coexists peacefully. New modules can have relations to undocumented modules for context.

## CI/CD Integration

```yaml
steps:
  - run: npm install -g @gaiaan/yggdrasil-cli
  - run: ygg check
  - run: ygg drift
```

Fast, local operations. Add seconds to CI, not minutes.

## Effort Estimate

| Scenario                        | Effort | Time to First Value |
| ------------------------------- | ------ | ------------------- |
| Greenfield, small               | Low    | Hours               |
| Greenfield, large               | Medium | Days                |
| Brownfield, new feature only    | Low    | Hours               |
| Brownfield, describe existing   | Medium | Days                |
| Brownfield, progressive replace | High   | Weeks per module    |

**Recommended start:** One new feature through the graph. Define nodes, materialize, see the result.

---

**See also:** [Getting Started](/getting-started), [FAQ](/faq)
