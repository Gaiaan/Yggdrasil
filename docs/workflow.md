# Workflow

The pipeline from requirements to running code. Use what you need — not every change requires every stage.

```
brief → clarify → plan → check → apply → materialize
                                              ↑
                                           drift ←── (continuous)
```

## Stage 1: Brief

Capture an unstructured requirement — feature request, bug report, idea.

**Tool:** `/ygg.brief` or write directly to `yggdrasil/.briefs/<slug>.md`

```markdown
# Password Reset via Email

## Context
Customers want to reset their password when they forget it.

## Requirements
- User clicks "Forgot password" and enters email
- System sends reset link valid for 24 hours
- User clicks link, enters new password
- Existing sessions invalidated after reset

## Acceptance Criteria
- Reset link expires after 24h
- Max 3 reset requests per hour per email
```

**Skip when:** You already know which nodes to create or modify.

## Stage 2: Clarify

Resolve ambiguities before planning.

**Tool:** `/ygg.clarify` — analyzes the brief, asks targeted questions, appends clarifications.

Example questions: "Should the reset link be one-time use?" "What if the email isn't in the system?" "Use existing EmailService or new one?"

**Skip when:** Brief is already precise.

## Stage 3: Plan

Propose graph changes based on the brief and current graph.

**Tool:** `/ygg.plan` — explores the graph progressively with `ygg tree` (using `--depth` and subtree filters to avoid flooding context), then uses `ygg build-context` and `ygg affected` to produce a plan.

Plan includes: new nodes, modified nodes, new relations, dependency order. May propose splitting coarse nodes or creating flows.

**Skip when:** Impact is obvious and you know what to do.

## Stage 4: Check

Validate graph consistency.

**Tool:** `ygg check`

Validates: relations point to existing nodes, tags are defined, no circular deps, mapping paths unique, flow participants exist, no conflicting tags.

**When to run:** After applying changes, before materializing, in CI.

## Stage 5: Apply

Make changes to graph files.

**Tool:** `/ygg.apply` or edit files manually.

Create directories, write `node.yaml`, add artifacts. No special CLI command — apply means editing files in `yggdrasil/`.

Then run `ygg check` to validate.

## Stage 6: Materialize

Generate code from graph nodes.

**Tool:** `/ygg.materialize`

1. Agent runs `ygg resolve-deps` to get dependency order
2. For each node: `ygg build-context <path>` → agent generates code and tests
3. Code written to `mapping.path`
4. Run tests

If tests fail, refine the graph and rematerialize — do not edit generated code.

## Drift (Continuous)

Detect when code was modified outside the graph.

**Tool:** `ygg drift` or `/ygg.drift`

When drift is found:

- **Absorb** — update graph to match code
- **Reject** — rematerialize to restore graph's version

## Minimum Viable Workflow

Edit graph files → `ygg check` → `ygg build-context` → agent generates code. Everything else is optional structure around that core loop.

---

**See also:** [CLI Reference](/cli-reference), [Agent Commands](/agent-commands)
