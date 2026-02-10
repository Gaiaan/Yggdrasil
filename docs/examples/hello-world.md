# Hello World Example

A minimal Yggdrasil graph demonstrating core concepts: nodes, artifacts, relations, tags, and aspects. Ideal for understanding the pipeline from graph to code.

**Location:** `examples/hello-world/`

## What It Demonstrates

| Concept | How It Appears |
|---------|----------------|
| **Hierarchy** | `auth/token-service` is a child of `auth/` — inherits module context |
| **Relations** | `token-service` and `greeting` both read from `users/user-repository` — context package includes the repository's interface |
| **Tags** | `greeting` has `requires-auth` — aspect requirements are injected |
| **Aspects** | `auth-middleware.yaml` binds to `requires-auth` — all tagged nodes get JWT requirements automatically |
| **Mapping** | Leaf nodes declare where code lives: `src/auth/token.service.ts`, etc. |

## Graph Structure

```
Hello World App
  auth/ (module) [requires-auth]
    token-service/ (service)
      mapping: src/auth/token.service.ts
  users/ (module)
    user-repository/ (service)
      mapping: src/users/user.repository.ts
  greeting/ (service) [public-api, requires-auth]
    mapping: src/greeting/greeting.service.ts
```

## CLI Commands to Try

From `examples/hello-world/`:

| Command | Purpose |
|---------|---------|
| `ygg tree` | See the graph hierarchy and mapping paths |
| `ygg check` | Validate graph consistency |
| `ygg build-context users/user-repository` | Build context for a simple node (no relations) |
| `ygg build-context auth/token-service` | Build context with relational layer (includes user-repository interface) |
| `ygg build-context greeting` | Build context with aspects (auth-middleware requirements injected) |
| `ygg resolve-deps` | See materialization order (stages) |
| `ygg affected users/user-repository` | See what depends on user-repository |
| `ygg status` | Overview of graph state |
| `ygg drift` | Compare code against materialization state |

## Materialization Flow

1. **Resolve order:** `ygg resolve-deps` produces:
   - Stage 1: `users/user-repository`
   - Stage 2 (parallel): `auth/token-service`, `greeting`

2. **Build context for each node:** `ygg build-context <node-path>` assembles the context package.

3. **Materialize:** Run `/ygg.materialize` in Cursor (or another agent). The agent:
   - Reads each context package
   - Generates implementation and tests
   - Writes to `mapping.path`

4. **Verify:** `npm install && npm test`

## Keeping the Example Clean

The `.gitignore` excludes generated output so only the graph and documentation are committed:

- `src/` — generated code
- `package.json`, `tsconfig.json` — project scaffolding created by materialization
- `.yggdrasil/.briefs/`, `.yggdrasil/.drift-state` — optional Yggdrasil state

Clone the repo, run `/ygg.materialize`, and you get a working project locally without polluting the example.
