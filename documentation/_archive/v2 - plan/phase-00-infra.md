# Phase 00 — Repository Infrastructure

## Goal

Prepare the repository for public open-source release on GitHub. Create all standard open-source files, update existing configs, set up CI/CD and DevContainer.

## Prerequisites

- None. This is the first phase.

---

## Step 1: Root-level open-source files

Create the following files at the repository root (`/workspaces/Yggdrasil/`):

### `LICENSE`

```
MIT License

Copyright (c) 2026 Gaiaan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### `CODE_OF_CONDUCT.md`

Use Contributor Covenant v2.1. Full text at: https://www.contributor-covenant.org/version/2/1/code_of_conduct/
Set enforcement contact to a project email or GitHub Issues.

### `SECURITY.md`

```markdown
# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Yggdrasil, please report it responsibly.

**Do NOT open a public issue.**

Instead, email: **security@gaiaan.dev** (or use GitHub's private vulnerability reporting feature).

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt within 48 hours and aim to release a fix within 7 days for critical issues.

## Scope

The Yggdrasil CLI (`ygg`) is a local-only tool that reads and writes files. It makes no network calls and has no authentication. Security concerns are primarily around:
- Path traversal in graph file parsing
- Arbitrary file read/write via mapping paths
- Denial of service via malformed YAML

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |
```

### `SUPPORT.md`

```markdown
# Support

## Getting Help

- **Documentation:** See [docs/](docs/) for user guides and CLI reference
- **Issues:** Open a [GitHub Issue](../../issues) for bugs, feature requests, or questions
- **Discussions:** Use [GitHub Discussions](../../discussions) for general questions and ideas

## Project Status

Yggdrasil is actively maintained. We welcome contributions — see [CONTRIBUTING.md](CONTRIBUTING.md).
```

### `CONTRIBUTING.md`

```markdown
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

See [documentation/v2/](documentation/v2/) for the full specification.
See [source/cli/README.md](source/cli/README.md) for CLI architecture overview.
```

### `CHANGELOG.md`

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial implementation of Yggdrasil CLI
- Commands: init, build-context, resolve-deps, check, drift, status, affected, tree
- Agent command templates for Claude Code, Cursor, GitHub Copilot, Gemini CLI
- Documentation site
```

### `AGENTS.md`

```markdown
# Multi-Agent Support

Yggdrasil works with any AI agent that can read markdown and run shell commands. Agent-specific integration is provided through command template files installed by `ygg init`.

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

See `documentation/v2/07-agent-commands.md` for the full specification of each command's content.
```

### `README.md`

Create a comprehensive README. Key sections (write actual content for each):

1. **Header** — Project name, one-line description, badges (CI status, npm version, license)
2. **What is Yggdrasil** — 3-sentence explanation + the concept diagram from spec
3. **Installation** — `npm install -g @gaiaan/yggdrasil-cli` + `ygg init --agent <name>`
4. **Quick Start** — 5-step getting started (init, define node, build-context, materialize)
5. **Concept Map** — The ASCII diagram from `documentation/v2/README.md` lines 63-89
6. **CLI Commands** — Table of all 8 commands with one-line descriptions
7. **Agent Commands** — Table of all 9 `/ygg.*` commands with one-line descriptions
8. **Supported Agents** — Table (Claude, Cursor, Copilot, Gemini)
9. **Documentation** — Link to docs site + link to `documentation/v2/` spec
10. **Contributing** — Link to CONTRIBUTING.md
11. **License** — MIT

Reference `documentation/v2/README.md` for the concept map and command lists. The root README should be user-facing (how to USE Yggdrasil), not specification-level.

### `.markdownlint-cli2.jsonc`

```jsonc
{
  "config": {
    "default": true,
    "MD013": false,
    "MD033": false,
    "MD041": false
  },
  "ignores": [
    "node_modules",
    "**/dist/**",
    "_baseline/**",
    "CHANGELOG.md"
  ]
}
```

---

## Step 2: Update existing config files

### `.gitignore` — APPEND these lines:

```
# Node.js
node_modules/
dist/
*.tgz
coverage/

# Yggdrasil test artifacts
.yggdrasil-test/

# OS
.DS_Store
Thumbs.db

# IDE (keep existing .cursor/commands/ ignore)
```

Keep the existing lines (`.cursor/commands/speckit*`, `.specify/**/*`, `.DS_Store`).

### `Yggdrasil.code-workspace` — UPDATE settings:

Add to the `settings` object:

```json
"chat.promptFilesRecommendations": {
  "ygg.brief": true,
  "ygg.plan": true,
  "ygg.apply": true,
  "ygg.materialize": true,
  "ygg.check": true
},
"chat.tools.terminal.autoApprove": {
  "source/cli/": true
}
```

Add to `cSpell.words`: `"yggdrasil"`, `"materialize"`, `"rematerialize"`, `"blackbox"`, `"gaiaan"`.

---

## Step 3: DevContainer

### `.devcontainer/Dockerfile` — REPLACE with:

```dockerfile
FROM mcr.microsoft.com/devcontainers/typescript-node:22

# Clean up
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

ENV SHELL=/bin/bash
```

### `.devcontainer/devcontainer.json` — REPLACE with:

```json
{
  "name": "Yggdrasil Dev",
  "build": {
    "dockerfile": "Dockerfile"
  },
  "features": {
    "ghcr.io/devcontainers/features/git:1": {},
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "streetsidesoftware.code-spell-checker",
        "EditorConfig.EditorConfig",
        "github.vscode-github-actions",
        "GitHub.vscode-pull-request-github",
        "yzhang.markdown-all-in-one",
        "bierner.markdown-mermaid",
        "redhat.vscode-yaml",
        "davidanson.vscode-markdownlint",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "vitest.explorer"
      ],
      "settings": {
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "editor.formatOnSave": true
      }
    }
  },
  "postAttachCommand": "bash .devcontainer/post-attach.sh",
  "remoteUser": "node"
}
```

### `.devcontainer/post-attach.sh` — REPLACE with:

```bash
#!/bin/bash
set -e

echo "=== Setting up Yggdrasil development environment ==="

# Install CLI dependencies and link globally
cd source/cli
npm install
npm link
cd ../..

echo "=== ygg CLI linked globally ==="
ygg --version

echo "=== Setup complete ==="
```

---

## Step 4: GitHub Actions

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
        working-directory: source/cli
      - run: npm run lint
        working-directory: source/cli
      - uses: DavidAnson/markdownlint-cli2-action@v18
        with:
          globs: "**/*.md"

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
        working-directory: source/cli
      - run: npm test -- --coverage
        working-directory: source/cli

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
        working-directory: source/cli
      - run: npm run build
        working-directory: source/cli
```

### `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    tags: ['v*']

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
        working-directory: source/cli
      - run: npm run build
        working-directory: source/cli
      - run: npm publish --provenance --access public
        working-directory: source/cli
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      - uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
```

### `.github/workflows/docs.yml`

```yaml
name: Docs

on:
  push:
    branches: [main]
    paths: ['docs/**']

permissions:
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install
        working-directory: docs
      - run: npm run build
        working-directory: docs
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

### `.github/CODEOWNERS`

```
* @gaiaan
```

### `.github/ISSUE_TEMPLATE/bug_report.md`

```markdown
---
name: Bug Report
about: Report a bug in Yggdrasil CLI
labels: bug
---

## Description
A clear description of the bug.

## Steps to Reproduce
1. ...
2. ...

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Environment
- OS:
- Node.js version:
- Yggdrasil version (`ygg --version`):
- Agent (if relevant):
```

### `.github/ISSUE_TEMPLATE/feature_request.md`

```markdown
---
name: Feature Request
about: Suggest a feature for Yggdrasil
labels: enhancement
---

## Problem
What problem does this solve?

## Proposed Solution
How should it work?

## Alternatives Considered
Other approaches you considered.
```

### `.github/pull_request_template.md`

```markdown
## Summary
What does this PR do?

## Changes
- ...

## Checklist
- [ ] Tests pass (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated (if behavior changed)
- [ ] CHANGELOG.md updated
```

---

## Verification

After completing this phase, verify:

1. All files exist at their expected paths
2. `git status` shows new files (do NOT commit yet — commit after verification)
3. `.gitignore` properly ignores `node_modules/`, `dist/`, `coverage/`
4. DevContainer builds without errors (if in codespace: rebuild container)
5. README.md renders correctly on GitHub

## Acceptance Criteria

- [ ] LICENSE file exists with MIT license
- [ ] CONTRIBUTING.md has prerequisites, dev setup, PR guidelines
- [ ] CODE_OF_CONDUCT.md exists
- [ ] SECURITY.md exists
- [ ] SUPPORT.md exists
- [ ] CHANGELOG.md exists with [Unreleased] section
- [ ] AGENTS.md documents 4 supported agents
- [ ] README.md has installation, quick start, concept map, command tables
- [ ] .github/workflows/ has ci.yml, release.yml, docs.yml
- [ ] .github/ISSUE_TEMPLATE/ has bug_report.md and feature_request.md
- [ ] .github/pull_request_template.md exists
- [ ] .devcontainer/ updated for Node.js 22
- [ ] .gitignore includes node_modules, dist, coverage
- [ ] Yggdrasil.code-workspace updated with ygg prompt recommendations
