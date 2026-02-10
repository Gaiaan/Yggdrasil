# Yggdrasil

> Graph-driven software development — a formal graph layer between human intent and generated code.

[![CI](https://github.com/Gaiaan/Yggdrasil/actions/workflows/ci.yml/badge.svg)](https://github.com/Gaiaan/Yggdrasil/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@gaiaan/yggdrasil-cli.svg)](https://www.npmjs.com/package/@gaiaan/yggdrasil-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![codecov](https://codecov.io/gh/Gaiaan/Yggdrasil/graph/badge.svg)](https://codecov.io/gh/Gaiaan/Yggdrasil)

## What is Yggdrasil

Yggdrasil is a **CLI toolset for graph-driven software development**. It introduces a formal graph layer (directories with YAML metadata and markdown artifacts) between human intent and generated code. AI agents receive precise, bounded context packages instead of searching through entire codebases — solving the context problem structurally.

The CLI (`ygg`) is a pure mechanical tool — no AI, no API keys. It reads graph files, builds context, resolves dependencies, validates consistency, detects drift. AI agents (Cursor, Claude Code, Gemini CLI, etc.) do the actual code generation, instructed by agent command files (`/ygg.*`).

```
Supervisor (human/AI) → Graph (files in .yggdrasil/) → CLI (build-context) → Agent (generates code)
```

## Installation

```bash
npm install -g @gaiaan/yggdrasil-cli
ygg init --agent <name>   # claude | cursor | copilot | gemini
# Update commands only: ygg init --agent cursor --commands-only
```

**Requirements:** Node.js 22+

## Quick Start

1. **Initialize** a graph in your project: `ygg init --agent cursor`
2. **Define a node** — create `.yggdrasil/auth/login-service/node.yaml` with metadata, tags, relations
3. **Build context** — run `ygg build-context auth/login-service` to assemble the context package
4. **Materialize** — use `/ygg.materialize` in your agent to generate code from the context
5. **Check consistency** — run `ygg check` to validate the graph

## Concept Map

```
┌─────────────────────────────────────────────────────────────────┐
│                         .yggdrasil/                              │
│                                                                  │
│  config.yaml          Global: stack, standards, tag definitions  │
│  aspects/             Cross-cutting concerns bound to tags       │
│  flows/               End-to-end processes spanning modules      │
│  .briefs/             Unstructured requirements input            │
│  .drift-state         Materialization hashes (auto-generated)    │
│                                                                  │
│  auth/                Node (directory with node.yaml)            │
│  ├── node.yaml        Metadata: name, type, tags, relations     │
│  ├── overview.md      Artifact: description                     │
│  ├── login-service/   Child node (nested directory)              │
│  │   ├── node.yaml                                              │
│  │   └── *.md         Artifacts: description, diagrams, etc.    │
│  └── auth-api/        Child node                                 │
│      ├── node.yaml                                              │
│      └── openapi.yaml Artifact: API contract                    │
│                                                                  │
│  orders/              Another node...                            │
│  └── ...                                                         │
└─────────────────────────────────────────────────────────────────┘

CLI (ygg):           init | build-context | resolve-deps | check | drift | status | affected | tree
Agent commands:      /ygg.brief | /ygg.clarify | /ygg.plan | /ygg.apply | /ygg.materialize | /ygg.drift | /ygg.define | /ygg.ingest | /ygg.check
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `ygg init` | Initialize a Yggdrasil graph in the current project |
| `ygg build-context <node-path>` | Build a complete context package for a node |
| `ygg resolve-deps` | Compute dependency tree and materialization order |
| `ygg check` | Validate graph consistency and relations |
| `ygg drift` | Detect code changes outside the graph |
| `ygg status` | Show graph status and recent changes |
| `ygg affected <node-path>` | List nodes affected by changes to a node |
| `ygg tree [path]` | Print the graph as a tree (supports subtree filter, `--depth`, `--compact`) |

## Agent Commands

| Command | Description |
|---------|-------------|
| `/ygg.brief` | Gather requirements and create a structured brief |
| `/ygg.clarify` | Analyze a brief and ask clarifying questions |
| `/ygg.plan` | Propose graph changes from a brief |
| `/ygg.apply` | Apply planned changes to the graph |
| `/ygg.check` | Validate graph consistency |
| `/ygg.materialize` | Generate code from the graph |
| `/ygg.drift` | Detect and absorb/reject drift |
| `/ygg.define` | Define a new node interactively |
| `/ygg.ingest` | Import existing code into the graph |

## Supported Agents

| Agent | Command Directory | Format |
|-------|------------------|--------|
| Claude Code | `.claude/commands/` | Markdown |
| Cursor | `.cursor/commands/` | Markdown |
| GitHub Copilot | `.github/agents/` | Markdown |
| Gemini CLI | `.gemini/commands/` | TOML |

## Documentation

- **User docs:** [docs/](docs/) — guides and CLI reference (VitePress site)
- **Specification:** [documentation/](documentation/) — full design and concepts
- **Example project:** [examples/hello-world/](examples/hello-world/) — minimal graph you can try immediately

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, PR guidelines, and code style.

## License

MIT — see [LICENSE](LICENSE).
