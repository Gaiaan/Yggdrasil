o # @gaiaan/yggdrasil-cli

> Graph-driven software development — a formal graph layer between human intent and generated code.

[![CI](https://github.com/Gaiaan/Yggdrasil/actions/workflows/ci.yml/badge.svg)](https://github.com/Gaiaan/Yggdrasil/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@gaiaan/yggdrasil-cli.svg)](https://www.npmjs.com/package/@gaiaan/yggdrasil-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A CLI toolset that introduces a formal graph layer (directories with YAML metadata and markdown artifacts) between human intent and generated code. AI agents receive precise, bounded context packages instead of searching through entire codebases — solving the context problem structurally.

The CLI (`ygg`) is a pure mechanical tool — no AI, no API keys. It reads graph files, builds context, resolves dependencies, validates consistency, detects drift.

```
Supervisor (human/AI) → Graph (files in .yggdrasil/) → CLI (build-context) → Agent (generates code)
```

## Installation

```bash
npm install -g @gaiaan/yggdrasil-cli
```

**Requirements:** Node.js 22+

## Quick Start

```bash
ygg init --agent cursor          # Initialize graph + install agent commands
ygg init --agent cursor --commands-only   # Update commands only (e.g. after npm update)
ygg tree                         # See the graph
ygg build-context auth/login     # Build context package for a node
ygg check                        # Validate graph consistency
ygg resolve-deps                 # Get materialization order
ygg drift                        # Detect code/graph divergence
```

## CLI Commands

| Command                    | Description                                         |
| -------------------------- | --------------------------------------------------- |
| `ygg init [--agent] [--commands-only]` | Initialize graph or update agent commands only |
| `ygg build-context <node>` | Build a complete 6-layer context package for a node |
| `ygg resolve-deps`         | Compute dependency tree and materialization order   |
| `ygg check`                | Validate graph consistency (9 rules)                |
| `ygg drift`                | Detect code changes outside the graph               |
| `ygg status`               | Show graph summary                                  |
| `ygg affected <node>`      | List nodes and flows depending on a node            |
| `ygg tree`                 | Display the graph as a visual tree                  |

## Agent Commands

Installed by `ygg init --agent <name>` into the agent's command directory:

| Command            | Description                                       |
| ------------------ | ------------------------------------------------- |
| `/ygg.brief`       | Gather requirements and create a structured brief |
| `/ygg.clarify`     | Analyze a brief and ask clarifying questions      |
| `/ygg.plan`        | Propose graph changes from a brief                |
| `/ygg.apply`       | Apply planned changes to the graph                |
| `/ygg.check`       | Validate graph consistency                        |
| `/ygg.materialize` | Generate code from the graph                      |
| `/ygg.drift`       | Detect and absorb/reject drift                    |
| `/ygg.define`      | Define a new node interactively                   |
| `/ygg.ingest`      | Import existing code into the graph               |

## Supported Agents

| Agent          | Directory           | Format   | Install                    |
| -------------- | ------------------- | -------- | -------------------------- |
| Claude Code    | `.claude/commands/` | Markdown | `ygg init --agent claude`  |
| Cursor         | `.cursor/commands/` | Markdown | `ygg init --agent cursor`  |
| GitHub Copilot | `.github/agents/`   | Markdown | `ygg init --agent copilot` |
| Gemini CLI     | `.gemini/commands/` | TOML     | `ygg init --agent gemini`  |

## Documentation

- **Full docs & guides:** [github.com/Gaiaan/Yggdrasil](https://github.com/Gaiaan/Yggdrasil)
- **Example project:** [examples/hello-world](https://github.com/Gaiaan/Yggdrasil/tree/main/examples/hello-world)

## License

MIT
