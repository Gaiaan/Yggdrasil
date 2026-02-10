# 05 — Workflow: From Requirements to Running Code

## The Pipeline

Yggdrasil defines a linear pipeline for turning requirements into code through the graph. Each stage has a clear input, a clear output, and can be executed by a human, an AI agent, or both.

```
brief → clarify → plan → check → apply → materialize
                                              ↑
                                           drift ←── (continuous detection)
```

Not every change requires every stage. A supervisor who knows exactly what to do can skip straight to editing graph files and materializing. The pipeline exists for the full workflow — use what you need.

For **brownfield adoption**, an alternative entry point exists: `/ygg.ingest` reads existing code and creates blackbox graph nodes. From there, the standard pipeline applies — future changes go through brief → plan → apply → materialize, using the ingested blackbox nodes as context.

---

## Stage 1: Brief

**Purpose:** Capture an unstructured requirement.

**Input:** Natural language — a feature request, a bug report, a business idea, a technical improvement.

**Output:** A brief file in `yggdrasil/.briefs/`.

**Who does it:** The supervisor writes it directly, or uses `/ygg.brief` to have the agent structure it conversationally.

### Brief file format

```markdown
# Password Reset via Email

## Context
Customers want to reset their password when they forget it.

## Requirements
- User clicks "Forgot password" and enters email
- System sends a reset link valid for 24 hours
- User clicks link, enters new password
- After reset, all existing sessions are invalidated

## Acceptance Criteria
- Reset link expires after 24h
- Maximum 3 reset requests per hour per email
- Reset email is sent within 30 seconds
```

The brief is deliberately simple. It does not reference the graph, nodes, or architecture. It is the **raw input** that the next stages transform into graph changes.

### When to skip

If the supervisor already knows which nodes to create or modify, they can skip briefing and go directly to editing graph files (the "apply" stage).

---

## Stage 2: Clarify

**Purpose:** Resolve ambiguities in the brief before planning graph changes.

**Input:** A brief file.

**Output:** Updated brief with clarifications appended.

**Who does it:** The agent (`/ygg.clarify`) analyzes the brief, identifies ambiguities across categories (scope, edge cases, constraints, integration points), and asks targeted questions. The supervisor answers. The brief is updated.

### Clarification categories

| Category | Example Question |
|---|---|
| Functional scope | "Should the reset link be one-time use, or can it be clicked multiple times within the 24h window?" |
| Edge cases | "What happens if the user requests a reset for an email not in the system?" |
| Integration | "Should the system use the existing EmailService or a new dedicated service?" |
| Constraints | "Is the 3 requests/hour limit per email address or per IP?" |
| Terminology | "By 'sessions are invalidated' — do you mean JWT tokens are revoked, or session records are deleted?" |

### When to skip

If the brief is already precise (e.g., written by a domain expert), or if the supervisor will handle ambiguities during planning.

---

## Stage 3: Plan

**Purpose:** Propose specific changes to the graph based on the brief.

**Input:** The brief (clarified or not) + the current state of the graph.

**Output:** A plan describing which nodes to create, modify, or relate.

**Who does it:** The agent (`/ygg.plan`) reads the brief, explores the graph progressively (using `ygg tree` with depth limits and subtree filtering, then `ygg build-context` for relevant nodes), and proposes changes.

### Plan format

```markdown
# Plan: Password Reset

## Impact Analysis
- **Affected module:** auth/
- **New nodes:** 2 (password-reset-service, password-reset-email)
- **Modified nodes:** 1 (auth-api — new endpoints)
- **New relations:** 1 (password-reset-service → users/user-repository)
- **Split nodes:** 0 (none — but if an existing node were too coarse, a split would be proposed here)

## Proposed Changes

### New: auth/password-reset-service/
- Type: service
- Tags: requires-auth, requires-audit
- Relations: → users/user-repository (reads), → auth/password-reset-email (uses)
- Artifacts needed: description.md, constraints.md

### New: auth/password-reset-email/
- Type: component
- Relations: (none beyond parent)
- Artifacts needed: description.md, email-template.md

### Modified: auth/auth-api/
- Add endpoints: POST /auth/reset-password, POST /auth/reset-password/confirm
- Update: openapi.yaml

## Dependency Order
1. auth/password-reset-email (no dependencies)
2. auth/password-reset-service (depends on password-reset-email, user-repository)
3. auth/auth-api (depends on password-reset-service)
```

The plan is a **proposal**, not an execution. The supervisor reviews it, adjusts it, and decides what to apply.

The plan may also propose:

- **Splitting existing nodes** that have become too coarse for the new requirements. Graph refactoring (splitting nodes, reorganizing hierarchy) is a normal part of the workflow — it happens at the graph level first, and code follows via rematerialization.
- **Creating flows** when the brief describes a process spanning multiple modules (e.g., checkout → payment → order → confirmation). Flows are created in `yggdrasil/flows/` and provide end-to-end context to all participating nodes.

### When to skip

If the supervisor already knows what graph changes to make. The plan stage is most valuable when the impact is not obvious — e.g., a brief that touches multiple modules.

---

## Stage 4: Check

**Purpose:** Validate the consistency and integrity of the graph.

**Input:** The current graph files.

**Output:** A list of issues (or confirmation that the graph is consistent).

**Who does it:** The CLI command `ygg check`. Can be invoked by the agent (`/ygg.check`) or directly by the supervisor.

### What check validates

| Check | Description |
|---|---|
| **Relation targets exist** | Every `relations[].target` in every `node.yaml` points to an existing node directory |
| **Tags are defined** | Every tag used in `node.yaml` is defined in `config.yaml` |
| **Aspects have matching tags** | Every aspect file references a tag that exists in `config.yaml` |
| **No orphan directories** | Every directory under `yggdrasil/` (except `aspects/`, `flows/`, `.briefs/`) either contains `node.yaml` or is a non-node resource directory |
| **No circular relations** | Relations do not form cycles (important for dependency resolution) |
| **Mapping paths are unique** | No two nodes map to the same code path |

### Output format

```
$ ygg check

✓ 23 nodes found
✓ All relation targets valid
✓ All tags defined
✗ Node orders/notification-handler: tag 'requires-email' not defined in config.yaml
✗ Node auth/login-service: relation target 'users/user-service' does not exist (did you mean 'users/user-repository'?)
✓ No circular relations
✓ All mappings unique

2 issues found.
```

Check is a **pure mechanical operation** — it reads files and validates structural rules. No AI involved.

### When to run

- After applying graph changes (before materializing)
- As a pre-commit hook
- As part of CI
- Whenever the agent suggests running it

---

## Stage 5: Apply

**Purpose:** Make changes to the graph files.

**Input:** A plan (from stage 3) or the supervisor's own decisions.

**Output:** Created/modified/deleted files in `yggdrasil/`.

**Who does it:**
- The supervisor manually (create directories, write YAML, write markdown)
- The agent (`/ygg.apply`) following the plan
- Both — agent creates scaffolding, supervisor fills in detail

### What "apply" means in practice

There is no special `ygg apply` CLI command. "Apply" means **editing files in `yggdrasil/`** — by whatever means the supervisor prefers.

The agent command `/ygg.apply` instructs the agent to create directories, write `node.yaml` files, scaffold artifacts based on the plan. But the supervisor can also open their editor and do it by hand. Or do both — let the agent create structure, then manually refine artifacts.

After applying, run `ygg check` to validate.

### The changeset

After changes are applied, `git diff yggdrasil/` shows the changeset. The supervisor can review it, commit it to a branch, create a pull request — standard git workflow. Nothing custom.

---

## Stage 6: Materialize

**Purpose:** Generate code from graph nodes.

**Input:** The graph (specifically, nodes that need materialization).

**Output:** Source code files and tests in the project repository.

**Who does it:** The agent (`/ygg.materialize`), using CLI tools to build context and resolve dependencies.

### How materialization works

1. **Identify targets.** Which nodes to materialize? Options:
   - A specific node: `ygg build-context orders/order-service`
   - All changed nodes: `ygg resolve-deps --changed` (compares graph to existing code via mappings)

2. **Resolve dependency order.** `ygg resolve-deps` analyzes relations and produces a materialization order where dependencies come first. Independent nodes can be done in parallel.

3. **For each node:**
   a. Run `ygg build-context <node-path>` → get the context package
   b. Agent reads the context package and generates implementation code
   c. Agent generates tests derived from the context (constraints become test cases, interface specs become contract tests)
   d. Agent writes files to the location specified in `mapping.path`

4. **Verify.** Run tests. If tests fail, the supervisor refines the graph (adds detail, splits nodes, adds constraints) and rematerializes. The supervisor does **not** edit generated code.

Detailed materialization mechanics are covered in [08-materialization.md](08-materialization.md).

---

## Continuous: Drift Detection

**Purpose:** Detect when generated code has been modified outside the graph.

**Input:** The graph (mapping paths) + actual files on disk.

**Output:** A list of nodes where code has diverged from the graph.

**Who does it:** The CLI command `ygg drift`. Can be run manually, by the agent (`/ygg.drift`), or in CI.

### How it works

For each node that has a `mapping` in `node.yaml`:
1. Check if the mapped file(s) exist
2. Compare file modification timestamps or content hashes against the last materialization
3. If changed → flag as drift

### Resolution

When drift is detected, the supervisor decides:
- **Absorb:** Update the graph to reflect the code change. The code becomes authoritative for this specific change.
- **Reject:** Rematerialize the node. The graph overwrites the code change.
- **Defer:** Acknowledge the drift and deal with it later (not recommended long-term).

Detailed drift mechanics are covered in [09-drift-detection.md](09-drift-detection.md).

---

## Pipeline Summary

| Stage | Tool | Input | Output | Required? |
|---|---|---|---|---|
| **Brief** | `/ygg.brief` or manual | Natural language | `.briefs/*.md` | Optional |
| **Clarify** | `/ygg.clarify` | Brief file | Updated brief | Optional |
| **Plan** | `/ygg.plan` | Brief + graph | Plan document | Optional |
| **Check** | `ygg check` | Graph files | Issue list | Recommended |
| **Apply** | `/ygg.apply` or manual | Plan / decisions | Modified graph files | Yes (something must change) |
| **Materialize** | `/ygg.materialize` | Graph + `build-context` | Source code + tests | Yes (to get code) |
| **Drift** | `ygg drift` | Graph mappings + code | Drift report | Continuous |

The minimum viable workflow: edit graph files → `ygg check` → `ygg build-context` → agent generates code. Everything else is optional structure around that core loop.
