# InitCommand

`ygg init [--agent <name>]` — Initialize a Yggdrasil graph in the current project.

## Options

- `--agent <name>` — Target agent: `claude`, `cursor`, `copilot`, `gemini`

## Behavior

1. Creates directory structure: `.yggdrasil/`, `.yggdrasil/aspects/`, `.yggdrasil/flows/`, `.yggdrasil/.briefs/`
2. Creates skeleton `config.yaml` with placeholders (name, stack, standards, limits, empty tags)
3. If `--agent` provided: runs the appropriate adapter to install command templates
4. If no `--agent`: prints list of available agents
5. Prints next steps to stdout

## Agent Adapters

Each agent has an installer function that copies templates from the package's `templates/commands/` directory to the agent's command directory, converting format if needed. Uses `getPackageRoot()` from utils/paths to locate template source files.
