# CLI Commands

Thin Commander.js wrappers. Each command:

1. Parses arguments and options via Commander
2. Calls `loadGraph(process.cwd())` to get the graph
3. Delegates to a core engine or formatter
4. Outputs to stdout (results) or stderr (warnings/errors)
5. Sets the process exit code

Commands do not contain business logic — they are the interface between the terminal and the core engines.

All commands use chalk for colored output and support `--format` where applicable.
