# Agent Templates

Agent command templates and format adapters.

## Commands (source/cli/src/templates/commands/)

9 canonical markdown prompt files that instruct AI agents how to use the CLI:
/ygg.brief, /ygg.clarify, /ygg.plan, /ygg.apply, /ygg.check, /ygg.materialize, /ygg.drift, /ygg.define, /ygg.ingest.

Each command has: frontmatter (description, handoffs, cli_tools), Context, Workflow, Rules sections.

Full specification: `docs/agent-commands.md`

## Adapters (source/cli/src/templates/adapters/)

Convert canonical markdown commands to agent-specific formats:

- claude.ts, cursor.ts — direct copy (markdown native)
- copilot.ts — adds `mode` to frontmatter
- gemini.ts — converts markdown → TOML, replaces $ARGUMENTS → {{args}}
