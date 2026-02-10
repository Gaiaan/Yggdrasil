# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-02-10

### Added

- `ygg init` — initialize Yggdrasil graph with agent command templates
- `ygg build-context` — build 6-layer context packages for nodes
- `ygg resolve-deps` — compute dependency-ordered materialization stages
- `ygg check` — validate graph consistency (9 rules)
- `ygg drift` — detect code/graph divergence with absorb support
- `ygg status` — show graph summary
- `ygg affected` — find reverse dependencies and flows
- `ygg tree` — display graph as visual tree
- Agent command templates for Claude Code, Cursor, GitHub Copilot, Gemini CLI
- Documentation site (VitePress)
