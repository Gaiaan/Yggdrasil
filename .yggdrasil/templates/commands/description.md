# Agent Command Templates

9 canonical markdown prompt files that instruct AI agents how to use the Yggdrasil CLI in structured workflows. These are the "glue" between the mechanical CLI and the AI agent.

## Workflow Discipline

The pipeline is strict: **brief → plan → apply**. Never skip steps.

- When the user describes a problem or asks "how to fix X": create a brief first with /ygg.brief. Do not implement.
- /ygg.plan produces a plan only. Do not implement. Wait for user approval.
- /ygg.apply applies only changes from an approved plan. If no plan exists, suggest creating a brief first.

Implementing before plan and apply leads to wasted work. The agent must follow the sequence.

## Graph as Source of Truth

Code is derived from the graph. The graph must hold **complete, concrete knowledge** — no placeholders, no "agent will figure out during materialization". The brief captures everything; the plan specifies full artifact content; /ygg.apply writes it to the graph. References to repo docs: use explicit paths (e.g. `docs/api-spec.md`).

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
