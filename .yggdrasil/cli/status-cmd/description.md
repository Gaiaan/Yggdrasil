# StatusCommand

`ygg status` — Show a summary of the graph state.

## Behavior

1. Loads graph
2. Computes statistics: node counts by type, blackbox count, mapped count, tag usage, aspect/flow/relation counts
3. Runs `detectDrift()` for drift summary
4. Outputs formatted summary with graph name, stack, node stats, drift state

## Output

No `--format` option — always text. No special exit codes.
