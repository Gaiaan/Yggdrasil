# Init: update commands without overwriting config

## Context

When updating the CLI (e.g. `npm update @gaiaan/yggdrasil-cli`), the user runs `ygg init --agent cursor` to get the latest agent command templates. But `ygg init` always overwrites `config.yaml` with a skeleton, wiping the user's custom project name, stack, standards, and tags.

The user only wants to refresh the agent commands — not reset the config.

## Requirements

- Add a way to update agent commands without touching `config.yaml`
- When doing a "commands-only" update, skip creating/overwriting config
- Preserve existing directory structure (aspects, flows, .briefs) — do not recreate or overwrite

## Acceptance Criteria

- New flag `ygg init --agent <name> --commands-only`: installs/updates agent commands only, never touches `config.yaml`, never creates directory structure
- `ygg init --agent cursor` (without flag): unchanged — creates structure, config, commands
- Update documentation: `documentation/06-cli-reference.md`, `documentation/10-adoption.md` (if init is mentioned), `docs/cli-reference.md`, and any other docs that describe init
- Update code: `source/cli/src/cli/init.ts`, `.yggdrasil/cli/init-cmd/description.md`
