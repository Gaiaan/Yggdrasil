# ResolveDepsCommand

`ygg resolve-deps [--changed] [--node <path>] [--format text|json]` — Compute dependency tree and materialization order.

## Options

- `--changed` — Only nodes whose graph files are newer than mapped code
- `--node <path>` — Specific node and its transitive dependencies
- `--format <format>` — Output: `text` (default) or `json`

## Behavior

1. Loads graph
2. Determines mode from options: `all`, `changed`, or `node`
3. Calls `resolveDeps(graph, { mode, nodePath })`
4. Outputs stages with parallel indicators

## Exit Codes

- 0: success
- 1: circular dependency detected
- 2: node not found
