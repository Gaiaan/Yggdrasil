# Tree scaling for large graphs

## Context

`ygg build-context` scales to any graph size — it produces bounded context
packages regardless of whether the graph has 10 or 10,000 nodes. This is
by design (see `docs/spec/context-builder.md`).

However, `ygg tree` has no such bound. It dumps the entire graph structure
to stdout. This matters because AI agents use `ygg tree` as the **first step**
in `/ygg.plan` ("Run `ygg tree` to understand the current graph structure").
For large graphs (hundreds of nodes), this fills the agent's context window
with irrelevant structure before the agent begins its real work.

The core problem: agents need a way to **navigate** the graph progressively
(top-level overview → drill into relevant module) rather than receive it
all at once.

## Requirements

- Add subtree filtering to `ygg tree`: `ygg tree <path>` shows only the
  subtree rooted at that path (e.g., `ygg tree auth/` shows only auth
  and its children)
- Add a `--compact` flag that hides metadata lines (artifact count, mapping
  paths) to reduce output size when only structure matters
- Update `/ygg.plan` agent command to use progressive navigation strategy:
  first `ygg tree --depth 1` for top-level overview, then
  `ygg tree <module>/` to drill into modules affected by the brief,
  instead of a single unbounded `ygg tree`
- Update any other agent commands that call `ygg tree` with the same
  progressive strategy

## Acceptance Criteria

- `ygg tree auth/` shows only the auth subtree (not the whole graph)
- `ygg tree --compact` shows structure without metadata lines
- `ygg tree auth/ --depth 1 --compact` combines all filters
- `ygg tree nonexistent/` returns a clear error (exit code 1)
- `/ygg.plan` command instructs the agent to explore the tree progressively
- Agent context usage for tree overview is bounded regardless of graph size
