# Rename graph directory: yggdrasil → .yggdrasil

## Context

The graph directory `yggdrasil/` sits visibly in the project root, adding clutter.
Renaming it to `.yggdrasil/` (hidden directory on Unix) aligns with conventions
used by `.git/`, `.github/`, `.vscode/` and keeps the project root clean.

The project is pre-release (v0.1, no external users yet), so this is a clean
breaking change with no backward-compatibility or migration concerns.

## Requirements

- Change the default graph directory name from `yggdrasil/` to `.yggdrasil/`
- Update `findYggRoot()` in `source/cli/src/utils/paths.ts` to look for `.yggdrasil/`
- Update `ygg init` to create `.yggdrasil/` instead of `yggdrasil/`
- Update all CLI code, tests, fixtures, and e2e tests referencing `yggdrasil/`
- Update documentation (all 10 spec docs + README + CONTRIBUTING)
- Update agent command templates that reference the directory name
- Update the example project (`examples/hello-world/`)
- Rename the self-graph directory from `yggdrasil/` to `.yggdrasil/`

## Acceptance Criteria

- `ygg init` creates `.yggdrasil/` directory
- `ygg check`, `ygg build-context`, and all other commands work with `.yggdrasil/`
- All tests pass (`npm test` in source/cli)
- No references to the old `yggdrasil/` directory name remain in code or docs
  (except CHANGELOG noting the rename)
- The self-graph validates: `ygg check` returns 0 issues
