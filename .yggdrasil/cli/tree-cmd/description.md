# TreeCommand

`ygg tree [<path>] [--depth <n>] [--compact] [--no-tags]` — Display the graph as a visual tree.

## Options

- `<path>` — Optional subtree filter: show only the subtree rooted at this node path (e.g., `ygg tree auth/`)
- `--depth <n>` — Maximum depth to display (unlimited by default)
- `--compact` — Hide metadata lines (artifact counts, mapping paths)
- `--no-tags` — Hide tags from display

## Behavior

1. Loads graph
2. If `<path>` is given, resolves it and uses that node as root; otherwise uses the full graph
3. Finds top-level nodes (no parent, or children of the subtree root)
4. Recursively prints tree with box-drawing characters (├──, └──, │)
5. Shows: node name, type in parentheses, tags in dim, [blackbox] indicator
6. Unless `--compact`, leaf nodes show artifact count and mapping paths
7. Nodes sorted alphabetically

## Context Management

For large graphs, unbounded `ygg tree` produces too much output for AI agent
context windows. Agent commands (particularly `/ygg.plan`) instruct agents to
navigate progressively: `ygg tree --depth 1 --compact` for overview, then
`ygg tree <module>/` to drill into relevant subtrees.
