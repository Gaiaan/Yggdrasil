# TreeCommand

`ygg tree [--depth <n>] [--no-tags]` — Display the graph as a visual tree.

## Options

- `--depth <n>` — Maximum depth to display (unlimited by default)
- `--no-tags` — Hide tags from display

## Behavior

1. Loads graph
2. Finds top-level nodes (no parent)
3. Recursively prints tree with box-drawing characters (├──, └──, │)
4. Shows: node name, type in parentheses, tags in dim, [blackbox] indicator
5. Leaf nodes show artifact count and mapping paths
6. Nodes sorted alphabetically
