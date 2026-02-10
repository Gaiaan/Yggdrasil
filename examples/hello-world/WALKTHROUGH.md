# CLI Walkthrough

A hands-on guide to every `ygg` command using this example project.

**Prerequisites:** Install the CLI globally:

```bash
npm install -g @gaiaan/yggdrasil-cli
```

Then `cd` into this directory:

```bash
cd examples/hello-world
```

---

## 1. View the graph

```bash
ygg tree
```

Output shows the hierarchy, types, tags, artifact counts, and mapping paths:

```
Hello World App
├── auth/ (module) [requires-auth]
│   └── token-service/ (service)
│       └── 1 artifacts, mapping: src/auth/token.service.ts
├── greeting/ (service) [public-api, requires-auth]
│   └── 1 artifacts, mapping: src/greeting/greeting.service.ts
└── users/ (module)
    └── user-repository/ (service)
        └── 1 artifacts, mapping: src/users/user.repository.ts
```

## 2. Graph status

```bash
ygg status
```

Shows a summary: node counts by type, tags in use, aspects, relations, mappings, and drift state.

## 3. Validate consistency

```bash
ygg check
```

Runs 9 validation rules: relation targets exist, tags are defined, no cycles, no duplicate mappings, aspect tags valid, flow participants exist, no conflicting tags, directory structure correct, context budget within limits.

Try JSON output for programmatic use:

```bash
ygg check --format json
```

## 4. Build context packages

This is the core value of Yggdrasil — assembling exactly the right context for a node.

**Simple node (no relations):**

```bash
ygg build-context users/user-repository
```

Layers included: global (stack/standards) → hierarchy (users/ module) → own (description.md).

**Node with a relation:**

```bash
ygg build-context auth/token-service
```

Same layers, plus the relational layer: artifacts from `users/user-repository` (its interface) are included because `token-service` declares `relations: [target: users/user-repository]`.

**Node with tags and aspects:**

```bash
ygg build-context greeting
```

This one has it all: global → hierarchy → own → relational (user-repository interface) → aspect (auth-middleware requirements injected via `requires-auth` tag).

Compare the three outputs — you can see how each layer adds precisely the information the agent needs.

**JSON format:**

```bash
ygg build-context greeting --format json
```

## 5. Dependency resolution

```bash
ygg resolve-deps
```

Shows the materialization order as stages. Nodes in the same stage are independent and can be built in parallel. Stages are sequential.

For a specific node and its transitive dependencies:

```bash
ygg resolve-deps --node greeting
```

JSON output:

```bash
ygg resolve-deps --format json
```

## 6. Reverse dependencies

What depends on a given node?

```bash
ygg affected users/user-repository
```

Shows that both `auth/token-service` and `greeting` depend on it, so changing `user-repository`'s interface means both consumers may need rematerialization.

```bash
ygg affected auth
```

## 7. Drift detection

Drift detection compares code on disk against the graph's expectations.

**Check current state** (everything will be unmaterialized since no code exists yet):

```bash
ygg drift
```

**Simulate materialization** — create a file and record its hash:

```bash
mkdir -p src/users
echo 'export class UserRepository {}' > src/users/user.repository.ts
ygg drift --absorb users/user-repository
```

**Verify** — the node now shows OK:

```bash
ygg drift
```

**Simulate drift** — edit the file directly (bypassing the graph):

```bash
echo '// hotfix added outside the graph' >> src/users/user.repository.ts
ygg drift
```

The node is now flagged as DRIFT. In a real workflow, you would either:

- **Absorb**: update the graph to match the code change
- **Reject**: rematerialize from the graph, overwriting the edit

**Clean up:**

```bash
rm -rf src .yggdrasil/.drift-state
```

## 8. Initialize a new project

Test `ygg init` in a temporary directory:

```bash
mkdir /tmp/ygg-sandbox && cd /tmp/ygg-sandbox

ygg init --agent cursor
```

This creates:

- `.yggdrasil/` with `config.yaml`, `aspects/`, `flows/`, `.briefs/`
- `.cursor/commands/ygg-*.md` — agent command files

Inspect the results:

```bash
ls .yggdrasil/
ls .cursor/commands/
```

Try other agents:

```bash
ygg init --agent claude   # → .claude/commands/ygg-*.md
ygg init --agent copilot  # → .github/agents/ygg-*.md
ygg init --agent gemini   # → .gemini/commands/ygg-*.toml
```

Clean up:

```bash
rm -rf /tmp/ygg-sandbox
```

---

## What about agent commands?

The `/ygg.*` commands (`/ygg.brief`, `/ygg.plan`, `/ygg.materialize`, etc.) are not CLI commands — they are markdown instruction files that AI agents read and follow. To test them:

1. Run `ygg init --agent cursor` in a project
2. Open the project in Cursor
3. Type `/ygg.materialize` (or any command) in the chat
4. The agent reads the instruction file and uses CLI tools (`ygg build-context`, `ygg resolve-deps`, etc.) as part of its workflow

The CLI provides data. The agent provides intelligence.
