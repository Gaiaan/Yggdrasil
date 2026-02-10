# Materialization always uses subagents when available

## Context

Materialization produces stages from `ygg resolve-deps`. Within a stage, nodes are independent and can be materialized in parallel. The current `/ygg.materialize` command says "If the agent supports parallel execution, they can be done simultaneously" — this is optional guidance. Agents often materialize nodes sequentially by default, even when parallel execution is possible.

Subagents (Cursor, Claude Code, etc.) allow spawning parallel tasks. When a stage has multiple nodes, using subagents reduces total time and keeps each node's context focused. The supervisor's intended behavior is: **always** use subagents when the agent supports them and the stage has multiple nodes.

## Requirements

- Update `/ygg.materialize` so that materialization **always** uses subagents when available
- For stages with multiple nodes, the agent must spawn a subagent per node (or equivalent parallel execution) instead of processing sequentially
- When the agent does not support subagents, fall back to sequential processing
- **Pass invocation context to subagents:** When a brief exists in `.yggdrasil/.briefs/` (e.g. from the brief → plan → apply → materialize pipeline), include it in the context given to each subagent. The subagent receives: (1) `ygg build-context <node>` output, (2) the relevant brief. This gives subagents the "why" — what feature or requirement drove the graph changes — not just the specification. If no brief exists (e.g. materializing "all changed" without a brief), subagents receive only build-context.
- Update documentation (doc 08, 07) to state that subagent use is mandatory when supported, and that invocation context (brief) is passed when available

## Acceptance Criteria

- `/ygg.materialize` workflow explicitly instructs: "For stages with 2+ nodes, ALWAYS use subagents if your agent supports them. Do not process nodes sequentially when parallel execution is available."
- `/ygg.materialize` instructs: "When spawning a subagent, pass: (1) the build-context output for that node, (2) the contents of the most recent brief in `.yggdrasil/.briefs/` if any exist. Subagents need the invocation context to understand why they are implementing this node."
- When no brief exists, subagents receive only build-context (unchanged behavior)
- Documentation reflects that subagent use is required when supported, and that brief is passed when available
- Agent command template and installed commands updated accordingly
