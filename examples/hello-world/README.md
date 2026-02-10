# Hello World — Yggdrasil Example

A minimal Yggdrasil graph demonstrating core concepts: nodes, artifacts, relations, tags, and aspects.

## Structure

```
yggdrasil/
├── config.yaml                    # Global: TypeScript/Express stack
├── aspects/
│   └── auth-middleware.yaml       # Cross-cutting: JWT auth requirement
├── auth/                          # Module: authentication
│   ├── node.yaml
│   ├── description.md
│   └── token-service/             # Service: JWT token operations
│       ├── node.yaml
│       └── description.md
├── users/                         # Module: user management
│   ├── node.yaml
│   ├── description.md
│   └── user-repository/           # Service: user data access
│       ├── node.yaml
│       └── description.md
└── greeting/                      # Service: authenticated greeting endpoint
    ├── node.yaml
    └── description.md
```

## Try It

```bash
# Install the CLI (if not already installed)
npm install -g @gaiaan/yggdrasil-cli

# From this directory:
ygg tree                              # See the graph
ygg check                             # Validate consistency
ygg build-context greeting            # See what context the agent gets
ygg build-context auth/token-service  # See context with relations
ygg resolve-deps                      # See materialization order
ygg affected users/user-repository    # See what depends on user-repository
ygg status                            # Overview of the graph
```

## Materialize

Run `/ygg.materialize` in Cursor (or another supported agent) to generate implementation code and tests from the graph. The agent creates `src/`, `package.json`, and `tsconfig.json`. Then:

```bash
npm install
npm test
```

The `.gitignore` excludes all generated output (`src/`, `package.json`, `tsconfig.json`, `.yggdrasil/.briefs/`, `.yggdrasil/.drift-state`) so the example stays clean — only the graph and documentation are committed.

## What This Demonstrates

- **Hierarchy**: `auth/token-service` is a child of `auth/` — it inherits module context
- **Relations**: `token-service` reads from `users/user-repository` — the context package includes the repository's interface
- **Tags**: `greeting` has `requires-auth` — the auth-middleware aspect is injected into its context
- **Aspects**: `auth-middleware.yaml` binds to `requires-auth` tag — all tagged nodes get JWT requirements automatically
- **Mapping**: Leaf nodes declare where code will live (`src/auth/token.service.ts`, etc.)
