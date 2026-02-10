# BuildContextCommand

`ygg build-context <node-path> [--format markdown|json]` — Build a complete context package for a node.

## Options

- `--format <format>` — Output format: `markdown` (default) or `json`

## Behavior

1. Loads graph via `loadGraph(process.cwd())`
2. Calls `buildContext(graph, nodePath)` to assemble the 6-layer package
3. Checks token count against `config.limits.context_warning_tokens`
4. If threshold exceeded: prints warning to stderr
5. Formats output via MarkdownFormatter or JsonFormatter
6. Prints result to stdout

## Exit Codes

- 0: success
- 1: node not found
- 2: broken relation (target not found)
