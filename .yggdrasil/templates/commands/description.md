# Agent Command Templates

9 canonical markdown prompt files that instruct AI agents how to use the Yggdrasil CLI in structured workflows. These are the "glue" between the mechanical CLI and the AI agent.

## Commands

| File | Command | Purpose | CLI Tools Used |
|------|---------|---------|---------------|
| ygg-brief.md | /ygg.brief | Gather requirements, create brief | (none) |
| ygg-clarify.md | /ygg.clarify | Analyze brief, ask questions | (none) |
| ygg-plan.md | /ygg.plan | Propose graph changes | ygg tree, ygg build-context, ygg affected |
| ygg-apply.md | /ygg.apply | Apply changes to graph files | ygg check |
| ygg-check.md | /ygg.check | Validate graph consistency | ygg check |
| ygg-materialize.md | /ygg.materialize | Generate code from graph | ygg resolve-deps, ygg build-context |
| ygg-drift.md | /ygg.drift | Detect and resolve drift | ygg drift |
| ygg-define.md | /ygg.define | Define a node conversationally | ygg check |
| ygg-ingest.md | /ygg.ingest | Import existing code as blackbox | ygg check |

## File Structure

Each command markdown file has:

- YAML frontmatter: `description`, `handoffs` (next commands to suggest), `cli_tools` (CLI tools the command uses)
- `## Context` — when to use this command
- `## Prerequisites` — what must exist (optional)
- `## Workflow` — numbered steps for the agent
- `## Rules` — constraints the agent must follow

## Placeholder

`$ARGUMENTS` in command text is replaced by the agent-specific argument syntax during adapter conversion.

Full specification: `docs/agent-commands.md`
