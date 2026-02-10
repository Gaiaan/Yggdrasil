# Phase 11 — Packaging and Release

## Goal

Finalize the npm package for publication, verify the full build pipeline, and prepare for the first release (v0.1.0).

## Prerequisites

- All previous phases complete
- Tests passing at 80%+ coverage

---

## Step 1: Verify package contents

Run `npm pack --dry-run` in `source/cli/` to see what will be published:

```bash
cd source/cli
npm pack --dry-run
```

Expected output should show:
- `dist/bin.js` (and other dist files)
- `dist/templates/commands/ygg-*.md` (9 files)
- `package.json`
- `README.md`

Verify that `node_modules/`, `tests/`, `src/`, config files are NOT included.

The `files` field in package.json controls this:
```json
"files": ["dist/", "templates/"]
```

**IMPORTANT:** Make sure the tsup build copies templates to `dist/templates/`. Check `tsup.config.ts` `onSuccess` hook.

---

## Step 2: Test global installation

```bash
cd source/cli
npm pack                    # creates gaiaan-yggdrasil-cli-0.1.0.tgz
npm install -g gaiaan-yggdrasil-cli-0.1.0.tgz

# Test
ygg --version               # 0.1.0
ygg --help                  # shows all commands

# Test init
mkdir /tmp/test-project && cd /tmp/test-project
ygg init --agent cursor
ls yggdrasil/               # config.yaml, aspects/, flows/, .briefs/
ls .cursor/commands/        # ygg-brief.md, ygg-plan.md, etc.

# Cleanup
npm uninstall -g @gaiaan/yggdrasil-cli
rm -rf /tmp/test-project
```

---

## Step 3: Verify CI pipeline

Ensure GitHub Actions workflows work:

- `ci.yml` — push a branch, verify lint + test + build pass
- `release.yml` — this runs on tag push (will test with actual release)
- `docs.yml` — verify docs build in CI

---

## Step 4: Update CHANGELOG.md

```markdown
## [0.1.0] - 2026-XX-XX

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
```

---

## Step 5: Create first release

```bash
# Ensure main branch is clean
git status

# Tag the release
git tag -a v0.1.0 -m "v0.1.0: Initial release"
git push origin v0.1.0

# This triggers release.yml which:
# 1. Builds the package
# 2. Publishes to npm (@gaiaan/yggdrasil-cli)
# 3. Creates GitHub Release with changelog
```

**NOTE:** Before the first npm publish, ensure:
- npm org `@gaiaan` exists on npmjs.com
- `NPM_TOKEN` secret is set in GitHub repo settings
- Package is set to public access (`--access public` in release.yml)

---

## Step 6: Post-release verification

```bash
# Verify npm publication
npm info @gaiaan/yggdrasil-cli

# Test installation from npm
npm install -g @gaiaan/yggdrasil-cli
ygg --version

# Verify GitHub Release page has release notes and tag
```

---

## Acceptance Criteria

- [ ] `npm pack` produces a valid tarball with correct files
- [ ] Global installation works and `ygg` command is available
- [ ] `ygg init --agent <name>` works from installed package (templates included)
- [ ] All 8 CLI commands work from globally installed package
- [ ] CHANGELOG.md updated for v0.1.0
- [ ] Git tag v0.1.0 created
- [ ] CI passes on main branch
- [ ] npm package published (or ready to publish)
- [ ] GitHub Release created with release notes
