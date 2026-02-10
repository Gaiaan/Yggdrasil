# AffectedCommand

`ygg affected <node-path> [--format text|json]` — Show nodes and flows that depend on a given node.

## Options

- `--format <format>` — Output: `text` (default) or `json`

## Behavior

1. Loads graph, validates the target node exists
2. Scans all nodes for `relations[].target` pointing to the given node
3. Scans all flows for membership of the given node
4. Text output: lists dependents with relation types, lists flows, summary counts
5. JSON output: `{ dependents: [{ path, relationType }], flows: [name] }`

## Exit Codes

- 0: success (even if no dependents found)
- 1: node not found
