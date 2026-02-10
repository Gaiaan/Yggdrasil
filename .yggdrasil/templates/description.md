# Agent Templates

Agent command templates and format adapters.

## Commands (source/cli/src/templates/commands/)

9 canonical markdown prompt files that instruct AI agents how to use the CLI:
/ygg.brief, /ygg.clarify, /ygg.plan, /ygg.apply, /ygg.check, /ygg.materialize, /ygg.drift, /ygg.define, /ygg.ingest.

Workflow: brief → plan → apply (strict; never implement before plan).

Each command has: frontmatter (description, handoffs, cli_tools), Context, Workflow, Rules sections.

Full specification: `docs/agent-commands.md`

## Adapters (source/cli/src/templates/adapters/)

Convert canonical markdown commands to agent-specific formats:

- claude.ts — adds `name` for slash command; cursor.ts — direct copy (markdown native)
- copilot.ts — outputs `.agent.md`, adds `name`, `tools`, converts handoffs `command`→`agent`
- gemini.ts — converts markdown → TOML, replaces $ARGUMENTS → {{args}}
