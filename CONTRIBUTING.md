# Contributing to Yggdrasil

Thank you for your interest in contributing to Yggdrasil!

## Prerequisites

- Node.js 22+
- npm 10+
- Git

## Development Setup

### Option A: Dev Container (recommended)

1. Open the repository in VS Code / Cursor
2. When prompted, click "Reopen in Container"
3. Wait for the container to build (first time takes ~2 minutes)
4. The CLI will be available as `ygg` globally

### Option B: Local

```bash
cd source/cli
npm install
npm run build
npm link    # makes `ygg` available globally
```

## Development Workflow

1. Create a feature branch: `git checkout -b feature/my-change`
2. Make changes in `source/cli/src/`
3. Run tests: `cd source/cli && npm test`
4. Run linter: `npm run lint`
5. Build: `npm run build`
6. Submit a PR against `main`

## Pull Request Guidelines

- Include tests for new functionality
- Update documentation if behavior changes
- Keep PRs focused — one feature/fix per PR
- Ensure CI passes before requesting review

## Code Style

- TypeScript strict mode
- ESM modules (`import`/`export`, not `require`)
- Prettier for formatting (runs on save if configured)
- ESLint for static analysis

## AI Contribution Disclosure

If you used AI tools to generate code for your contribution, please note this in the PR description. This is not a restriction — just transparency.

## Architecture

See [docs/](docs/) for guides and specifications.
See [source/cli/README.md](source/cli/README.md) for CLI architecture overview.

### This repo uses its own mechanism

Yggdrasil dogfoods itself — the `.yggdrasil/` directory at the project root describes the CLI's own architecture as a graph. The same workflow (brief → plan → apply → materialize → drift) applies to developing Yggdrasil itself. Agent commands in `.cursor/commands/` are installed for Cursor and work on this graph.

After updating the CLI code, run:

```bash
ygg init --agent cursor --commands-only
```

The `--commands-only` flag refreshes agent command files (`.cursor/commands/ygg-*.md`) to match the latest templates bundled with the CLI, **without overwriting** `.yggdrasil/config.yaml` or any other graph files. Use this whenever the CLI version is bumped and command templates may have changed.
