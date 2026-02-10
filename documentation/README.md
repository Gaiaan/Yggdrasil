# Yggdrasil — Graph-Driven Software Development

A toolset that introduces a formal graph layer between human intent and generated code. AI agents receive precise, bounded context packages instead of searching through entire codebases — solving the context problem structurally.

```
Supervisor (human/AI) → Graph (files in yggdrasil/) → CLI (build-context) → Agent (generates code)
```

**Installation:** `npm install -g @yggdrasil/cli`  
**Runtime:** Node.js 22+ / TypeScript  
**Works with:** Claude Code, Cursor, Gemini CLI, GitHub Copilot, or any AI agent that can read markdown and run shell commands.

---

## Documentation

Documents are ordered from general to specific. Each builds on the previous.

### Foundation

| Document | Description |
|---|---|
| [01 — Vision and Motivation](01-vision.md) | Why existing AI tools hit a wall. What Yggdrasil is. Value proposition. |
| [02 — Core Concepts](02-core-concepts.md) | The two worlds (Graph vs Code). Key principles. Complete glossary of terms. |

### The Graph

| Document | Description |
|---|---|
| [03 — Graph Structure](03-graph-structure.md) | Directory hierarchy as graph. `node.yaml` schema. Artifacts. `config.yaml`. Tags. Aspects. Relations. |
| [04 — Context Builder](04-context-builder.md) | How `build-context` assembles the six-layer context package. Output format. |

### Workflow

| Document | Description |
|---|---|
| [05 — Workflow](05-workflow.md) | The full pipeline: brief → clarify → plan → check → apply → materialize → drift. |

### Tools and Commands

| Document | Description |
|---|---|
| [06 — CLI Reference](06-cli-reference.md) | All `ygg` CLI commands. Pure toolset, no AI, no API keys. Inputs and outputs. |
| [07 — Agent Commands](07-agent-commands.md) | `/ygg.*` commands. Markdown format. How agents use the CLI. Full command reference. |

### Materialization and Sync

| Document | Description |
|---|---|
| [08 — Materialization](08-materialization.md) | How code is generated from the graph. Dependency ordering. Parallelism. The feedback loop. |
| [09 — Drift Detection](09-drift-detection.md) | Detecting code changes outside the graph. Absorb vs reject. CI integration. |

### Adoption

| Document | Description |
|---|---|
| [10 — Adoption](10-adoption.md) | Greenfield and brownfield paths. Incremental adoption. Integration with git, CI, IDEs. |

---

## Quick Concept Map

```
┌─────────────────────────────────────────────────────────────────┐
│                         yggdrasil/                               │
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

CLI (ygg):           build-context | resolve-deps | check | drift | affected | status | tree
Agent commands:      /ygg.brief | /ygg.clarify | /ygg.plan | /ygg.apply | /ygg.materialize | /ygg.drift | /ygg.define | /ygg.ingest | /ygg.check
```

---

**Version:** 2.0  
**Date:** February 9, 2026  
**Status:** Complete specification — ready for implementation
