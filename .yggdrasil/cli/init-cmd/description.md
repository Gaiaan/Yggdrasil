# InitCommand

`ygg init [--agent <name>] [--commands-only]` — Initialize a Yggdrasil graph in the current project.

## Options

- `--agent <name>` — Target agent: `claude`, `cursor`, `copilot`, `gemini`
- `--commands-only` — Only install or update agent commands; do not touch `config.yaml` or directory structure. Use when updating the CLI (e.g. after `npm update`). Requires `--agent`.

## Behavior

**Without `--commands-only`:**

1. Creates directory structure: `.yggdrasil/`, `.yggdrasil/aspects/`, `.yggdrasil/flows/`, `.yggdrasil/.briefs/`
2. Creates skeleton `config.yaml` with placeholders (name, stack, standards, limits, empty tags)
3. If `--agent` provided: runs the appropriate adapter to install command templates
4. If no `--agent`: prints list of available agents
5. Prints next steps to stdout

**With `--commands-only`:**

1. Installs or updates agent commands only (no config, no directory changes)
2. Requires `--agent`

## Agent Adapters

Each agent has an installer function that copies templates from the package's `templates/commands/` directory to the agent's command directory, converting format if needed. Uses `getPackageRoot()` from utils/paths to locate template source files.
