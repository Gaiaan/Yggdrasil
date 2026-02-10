# Installation

## Prerequisites

- **Node.js 22+** — Yggdrasil runs on Node.js and requires the latest LTS release.
- **npm** — Used for global installation.

## Global Install

```bash
npm install -g @gaiaan/yggdrasil-cli
```

Verify installation:

```bash
ygg --version
```

## Initialize a Project

From your project root:

```bash
ygg init --agent cursor
```

If you omit `--agent`, the CLI will prompt you to choose:

| Agent | Flag | Command Directory |
|-------|------|-------------------|
| Claude Code | `--agent claude` | `.claude/commands/` |
| Cursor | `--agent cursor` | `.cursor/commands/` |
| GitHub Copilot | `--agent copilot` | `.github/agents/` |
| Gemini CLI | `--agent gemini` | `.gemini/commands/` |

## What `ygg init` Creates

- `.yggdrasil/config.yaml` — Skeleton with project name and stack placeholders
- `.yggdrasil/aspects/` — Empty directory for cross-cutting concerns
- `.yggdrasil/flows/` — Empty directory for end-to-end flows
- `.yggdrasil/.briefs/` — Empty directory for requirement briefs
- Agent command files in the appropriate directory

**Updating the CLI:** After `npm update @gaiaan/yggdrasil-cli`, run `ygg init --agent cursor --commands-only` to refresh agent commands without overwriting your config.

## Verify the Setup

```bash
# Check graph structure (use --depth for large graphs)
ygg tree
ygg tree --depth 2 --compact   # for large graphs

# Validate (will report if config needs attention)
ygg check
```

## Troubleshooting

- **Command not found:** Ensure npm's global bin directory is in your `PATH`.
- **Permission errors:** Avoid `sudo`; use a Node version manager (nvm, fnm) instead.
- **Wrong Node version:** Run `node --version` — must be 22 or higher.
