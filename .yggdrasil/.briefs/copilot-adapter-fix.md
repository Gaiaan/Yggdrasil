# GitHub Copilot: Commands not showing in chat

## Context

CLI creates commands in target repos via `ygg init --agent copilot`. For Cursor it works — slash commands appear in chat. For Copilot they don't, because GitHub Copilot uses Custom Agents (dropdown selection) not slash commands, and requires different file format.

## Requirements

- Copilot adapter outputs `.agent.md` files (not `.md`) — GitHub/VS Code expect this format
- Add `name` and `description` in frontmatter (required for agents dropdown)
- Convert handoffs: `command: /ygg.xyz` → `agent: ygg-xyz` (Copilot uses agent identifiers)
- Add `tools` for agent capabilities (read, search, edit, execute)
- Remove `cli_tools` from Copilot output (not supported)
- Update docs: explain that Copilot agents appear in dropdown, not as slash commands

## Acceptance Criteria

- `ygg init --agent copilot --commands-only` creates `ygg-*.agent.md` in `.github/agents/`
- Each agent file has `name`, `description`, `tools`, and handoffs with `agent:` refs
- Agent commands appear in Copilot chat dropdown when repo is opened in VS Code
- Documentation (AGENTS.md, docs/agent-commands.md) explains how to use agents in Copilot
