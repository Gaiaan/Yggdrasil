# CheckCommand

`ygg check [--format text|json]` — Validate graph structural consistency.

## Options

- `--format <format>` — Output: `text` (default) or `json`

## Behavior

1. Loads graph
2. Calls `validate(graph)`
3. Text output: shows node count, errors (red), warnings (yellow), success/failure message
4. JSON output: `{ issues: [...], nodesScanned: N }`

## Exit Codes

- 0: no issues
- 1: issues found (errors — warnings alone don't fail)
