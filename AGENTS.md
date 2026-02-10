# Multi-Agent Support

Yggdrasil works with any AI agent that can read markdown and run shell commands. Agent-specific integration is provided through command template files installed by `ygg init`. After updating the CLI, use `ygg init --agent <name> --commands-only` to refresh commands without overwriting config.

## Supported Agents

| Agent | Command Directory | Format | Install |
|-------|------------------|--------|---------|
| Claude Code | `.claude/commands/` | Markdown (.md) | `ygg init --agent claude` |
| Cursor | `.cursor/commands/` | Markdown (.md) | `ygg init --agent cursor` |
| GitHub Copilot | `.github/agents/` | Markdown (.md) | `ygg init --agent copilot` |
| Gemini CLI | `.gemini/commands/` | TOML (.toml) | `ygg init --agent gemini` |

## How Agent Commands Work

Agent commands are files placed in the agent's command directory. When a user types `/ygg.materialize` in their agent's chat, the agent reads the corresponding command file and follows its instructions.

Commands instruct the agent to:
1. Call `ygg` CLI tools for mechanical operations (building context, resolving deps, checking consistency)
2. Use its AI capabilities for creative work (generating code, conversing with the user, making decisions)

## Adding a New Agent

To add support for a new agent:

1. Create an adapter in `source/cli/src/templates/adapters/<agent-name>.ts`
2. The adapter converts the canonical markdown commands to the agent's format
3. Register the adapter in `source/cli/src/cli/init.ts`
4. Update this document and the README
5. Submit a PR

### Adapter Requirements

- Read canonical commands from `templates/commands/*.md`
- Convert frontmatter and content to the target format
- Replace `$ARGUMENTS` placeholder with agent-specific equivalent
- Write output files to the agent's command directory

## Command File Format

See `documentation/07-agent-commands.md` for the full specification of each command's content.
