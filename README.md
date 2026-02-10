<div align="center">
  <img src="docs/public/logo.svg" alt="Yggdrasil" width="128" />
</div>

# Yggdrasil

> Graph-driven software development — a formal graph layer between human intent and generated code.

[![CI](https://github.com/Gaiaan/Yggdrasil/actions/workflows/ci.yml/badge.svg)](https://github.com/Gaiaan/Yggdrasil/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@gaiaan/yggdrasil-cli.svg)](https://www.npmjs.com/package/@gaiaan/yggdrasil-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![codecov](https://codecov.io/gh/Gaiaan/Yggdrasil/graph/badge.svg)](https://codecov.io/gh/Gaiaan/Yggdrasil)

## What is Yggdrasil

Yggdrasil improves **AI-assisted coding** for both **greenfield** (new projects) and **brownfield** (existing codebases). It introduces a formal graph layer between human intent and generated code — so the agent sees exactly the right context instead of drowning in the whole codebase.

You work mainly through **agent commands** (`/ygg.materialize`, `/ygg.brief`, `/ygg.plan`, etc.) in your AI assistant (Cursor, Claude Code, Gemini CLI, Copilot). The agent reads these commands and uses the **CLI** (`ygg`) as a helper: build-context, resolve-deps, check, drift — pure mechanical operations with no API keys.

The graph lives in `.yggdrasil/` (directories = nodes, files = specs). It is the **single source of truth** — a formal "map" of the system (modules, interfaces, relations, constraints) that survives sessions and scales with verification. You edit the graph; the agent materializes code from it. Quality of output is a function of graph quality, not codebase size.

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
3. **Materialize** — use `/ygg.materialize` in your agent to generate code from the graph
4. **Add features** — edit the graph, run `/ygg.materialize` again; use `/ygg.brief` and `/ygg.plan` for bigger changes
5. **Check & drift** — `/ygg.check` validates the graph; `/ygg.drift` detects manual code edits

## Concept Map

```
.yggdrasil/
  config.yaml          Global: stack, standards, tag definitions
  aspects/             Cross-cutting concerns bound to tags
  flows/               End-to-end processes spanning modules
  .briefs/             Unstructured requirements input
  .drift-state         Materialization hashes (auto-generated)

  auth/                Node (directory with node.yaml)
    node.yaml          Metadata: name, type, tags, relations
    overview.md        Artifact: description
    login-service/     Child node (nested directory)
      node.yaml
      *.md             Artifacts: description, diagrams, etc.
    auth-api/          Child node
      node.yaml
      openapi.yaml     Artifact: API contract

  orders/              Another node...
    ...

Agent commands:      /ygg.brief | /ygg.clarify | /ygg.plan | /ygg.apply | /ygg.materialize | /ygg.drift | /ygg.define | /ygg.ingest | /ygg.check
CLI (helper):        init | build-context | resolve-deps | check | drift | status | affected | tree
```

## Agent Commands

These are what you use in your AI assistant. The agent calls the CLI internally.

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

## CLI (Helper for the Agent)

The `ygg` CLI is a mechanical tool — no AI, no API keys. The agent uses it when you run commands above.

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

## Supported Agents

| Agent | Command Directory | Format |
|-------|------------------|--------|
| Claude Code | `.claude/commands/` | Markdown |
| Cursor | `.cursor/commands/` | Markdown |
| GitHub Copilot | `.github/agents/` | Markdown |
| Gemini CLI | `.gemini/commands/` | TOML |

## Try the Coffee Shop Example

Want to see Yggdrasil in action? The **coffee shop** is a blog-store: landing, products, blog, curiosities, cart, checkout, and a CMS. ~5 minutes to a running app.

**Setup:**

1. Clone the repo, open `examples/coffee-shop` in your IDE (with Cursor or another supported agent).
2. Install the CLI: `npm install -g @gaiaan/yggdrasil-cli`
3. Tell your agent: *"Work in this directory. Run /ygg.materialize to generate the implementation."*
4. When done: `npm install && npm run dev` — open the app in your browser.
5. Browse the store, add products via `/admin` (login: `admin@coffee.shop` / `admin123`), try checkout.

Then add a feature: edit the graph (e.g. new node for product categories), run `/ygg.materialize` again. See [Playing with Examples](docs/examples-playing.md) for the full workflow.

## Documentation

- **Docs:** [https://gaiaan.github.io/Yggdrasil/](https://gaiaan.github.io/Yggdrasil/) — guides, CLI reference, and full design
- **Vision:** [https://gaiaan.github.io/Yggdrasil/spec/vision.html](https://gaiaan.github.io/Yggdrasil/spec/vision.html) — problem, thesis, value for greenfield & brownfield
- **Examples:** [examples/hello-world/](examples/hello-world/), [examples/coffee-shop/](examples/coffee-shop/) — minimal graphs to try

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, PR guidelines, and code style.

## License

MIT — see [LICENSE](LICENSE).
