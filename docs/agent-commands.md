# Agent Commands

Agent commands are markdown files installed by `ygg init`. When you type `/ygg.materialize` in your agent's chat, it reads the command file and follows its instructions — calling the CLI for mechanical work and using AI for code generation. After updating the CLI, run `ygg init --agent <name> --commands-only` to refresh commands without overwriting your config.

## Supported Agents

| Agent | Command Directory | Format |
|-------|------------------|--------|
| Claude Code | `.claude/commands/` | Markdown |
| Cursor | `.cursor/commands/` | Markdown |
| GitHub Copilot | `.github/agents/` | Markdown |
| Gemini CLI | `.gemini/commands/` | TOML |

## Command Overview

| Command | Purpose |
|---------|---------|
| `/ygg.brief` | Gather requirements and create a structured brief |
| `/ygg.clarify` | Analyze a brief and resolve ambiguities |
| `/ygg.plan` | Propose graph changes based on a brief |
| `/ygg.apply` | Create or modify graph files from a plan |
| `/ygg.check` | Run graph validation and report results |
| `/ygg.materialize` | Generate code from graph nodes |
| `/ygg.drift` | Detect and resolve code divergence |
| `/ygg.define` | Define or edit a node conversationally |
| `/ygg.ingest` | Bring existing code into the graph as blackbox nodes |

## How They Use the CLI

The pattern is consistent:

```
Agent reads command → follows instructions → calls ygg CLI → does AI work
```

| Command | CLI Tools Used |
|---------|----------------|
| `/ygg.brief` | Creates `.briefs/` files only |
| `/ygg.clarify` | Reads brief files |
| `/ygg.plan` | `ygg tree` (with `--depth`/subtree filters), `ygg build-context`, `ygg affected` |
| `/ygg.apply` | `ygg check` (after changes) |
| `/ygg.check` | `ygg check` |
| `/ygg.materialize` | `ygg resolve-deps`, `ygg build-context` |
| `/ygg.drift` | `ygg drift` |
| `/ygg.define` | `ygg check` (after creating node) |
| `/ygg.ingest` | `ygg check` (after creating nodes) |

The CLI provides data; the agent provides intelligence. Neither replaces the other.

## Workflow Mapping

| Stage | Agent Command |
|-------|---------------|
| Brief | `/ygg.brief` |
| Clarify | `/ygg.clarify` |
| Plan | `/ygg.plan` |
| Apply | `/ygg.apply` |
| Check | `/ygg.check` |
| Materialize | `/ygg.materialize` |
| Drift | `/ygg.drift` |

**Ad-hoc:** `/ygg.define` for conversational node creation, `/ygg.ingest` for brownfield adoption.

---

**See also:** [Workflow](/workflow), [CLI Reference](/cli-reference)
