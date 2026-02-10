# DriftCommand

`ygg drift [--node <path>] [--absorb <path>] [--format text|json]` — Detect code/graph divergence.

## Options

- `--node <path>` — Check a specific node only
- `--absorb <path>` — Absorb drift for a node (update .drift-state with current hash)
- `--format <format>` — Output: `text` (default) or `json`

## Behavior

- If `--absorb`: calls `absorbDrift(graph, nodePath)` and exits
- Otherwise: calls `detectDrift(graph, filterNodePath?)` and outputs report
- Text output: shows each node → mapping with status (OK green, DRIFT red, MISSING yellow, UNMATERIALIZED dim), plus summary
- JSON output: `{ entries: [...], totalChecked, driftCount, missingCount }`

## Exit Codes

- 0: no drift
- 1: drift detected
- 2: missing mapped files
