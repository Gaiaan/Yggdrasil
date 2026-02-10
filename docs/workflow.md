# Workflow

The pipeline from requirements to running code. Use what you need — not every change requires every stage.

```
brief -> clarify -> plan -> check -> apply -> materialize
                                              ^
                                           drift <-- (continuous)
```

For **brownfield adoption**, an alternative entry point exists: `/ygg.ingest` reads existing code and creates blackbox graph nodes. From there, the standard pipeline applies. See [Adoption Guide](/adoption-guide).

## Stage 1: Brief

**Purpose:** Capture an unstructured requirement — feature request, bug report, idea.

**Tool:** `/ygg.brief` or write directly to `.yggdrasil/.briefs/<slug>.md`

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

**Skip when:** You already know which nodes to create or modify.

## Stage 2: Clarify

**Purpose:** Resolve ambiguities in the brief before planning graph changes.

**Tool:** `/ygg.clarify` — analyzes the brief, identifies ambiguities, asks targeted questions, appends clarifications.

### Clarification categories

| Category | Example Question |
|---|---|
| Functional scope | "Should the reset link be one-time use, or can it be clicked multiple times within 24h?" |
| Edge cases | "What happens if the user requests a reset for an email not in the system?" |
| Integration | "Should the system use the existing EmailService or a new dedicated service?" |
| Constraints | "Is the 3 requests/hour limit per email address or per IP?" |
| Terminology | "By 'sessions are invalidated' — do you mean JWT tokens are revoked, or session records are deleted?" |

**Skip when:** Brief is already precise (e.g., written by a domain expert).

## Stage 3: Plan

**Purpose:** Propose specific graph changes based on the brief and current graph.

**Tool:** `/ygg.plan` — explores the graph progressively with `ygg tree` (using `--depth` and subtree filters), then uses `ygg build-context` and `ygg affected` to produce a plan.

### Plan format

```markdown
# Plan: Password Reset

## Impact Analysis
- **Affected module:** auth/
- **New nodes:** 2 (password-reset-service, password-reset-email)
- **Modified nodes:** 1 (auth-api — new endpoints)
- **New relations:** 1 (password-reset-service → users/user-repository)

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

The plan is a **proposal**, not an execution. The supervisor reviews and decides what to apply. The plan may also propose:

- **Splitting existing nodes** that have become too coarse for new requirements.
- **Creating flows** when the brief describes a process spanning multiple modules.

**Skip when:** Impact is obvious and you know what to do.

## Stage 4: Check

**Purpose:** Validate graph consistency.

**Tool:** `ygg check`

### What check validates

| Check | Description |
|---|---|
| **Relation targets exist** | Every `relations[].target` points to an existing node directory |
| **Tags are defined** | Every tag in `node.yaml` is defined in `config.yaml` |
| **Aspects have matching tags** | Every aspect file references a defined tag |
| **No orphan directories** | Directories under `.yggdrasil/` (except `aspects/`, `flows/`, `.briefs/`) contain `node.yaml` |
| **No circular relations** | Relations do not form cycles |
| **Mapping paths are unique** | No two nodes map to the same code path |
| **Context budget** | Warns when a node's context package exceeds `limits.context_warning_tokens` |
| **Tag conflicts** | Reports error if a node carries conflicting tags |
| **Flow participants exist** | Every node listed in `flow.yaml` exists |

### Example output

```
$ ygg check

✓ 23 nodes found
✓ All relation targets valid
✓ All tags defined
✗ Node orders/notification-handler: tag 'requires-email' not defined in config.yaml
✗ Node auth/login-service: relation target 'users/user-service' does not exist
  (did you mean 'users/user-repository'?)
✓ No circular relations
✓ All mappings unique

2 issues found.
```

**When to run:** After applying changes, before materializing, as a pre-commit hook, in CI.

## Stage 5: Apply

**Purpose:** Make changes to graph files.

**Tool:** `/ygg.apply` or edit files manually.

There is no special `ygg apply` CLI command. "Apply" means **editing files in `.yggdrasil/`**:

- Create directories for new nodes
- Write `node.yaml` files
- Add artifact files (descriptions, constraints, interfaces)

The agent can scaffold structure, the supervisor fills in detail, or both. After applying, run `ygg check` to validate.

The changeset is visible via `git diff .yggdrasil/` — standard git workflow.

## Stage 6: Materialize

**Purpose:** Generate code from graph nodes.

**Tool:** `/ygg.materialize`

### How materialization works

1. **Identify targets.** Which nodes to materialize:
   - A specific node: `ygg build-context orders/order-service`
   - All changed nodes: `ygg resolve-deps --changed`

2. **Resolve dependency order.** `ygg resolve-deps` produces **stages**. Within a stage, all nodes are independent and can be materialized in parallel. Stages are sequential.

   ```
   Stage 1 (parallel):  email-service, sms-provider
                          ↓
   Stage 2 (parallel):  password-reset-service
                          ↓
   Stage 3:             auth-api (updated endpoints)
                          ↓
   Stage 4:             integration tests
   ```

3. **For each node:**
   a. Run `ygg build-context <node-path>` to get the context package
   b. Agent reads the package and generates implementation code
   c. Agent generates tests derived from context (constraints become test cases, interfaces become contract tests)
   d. Agent writes files to `mapping.path`

4. **Verify.** Run tests. If tests fail, refine the graph (add detail, split nodes, add constraints) and rematerialize — do **not** edit generated code.

### The materialization feedback loop

When code is not good enough:

1. Identify why — vague description? Missing constraints? Underspecified interface? Node too large?
2. Refine the graph — add detail, split nodes, add explicit constraints, add a sequence diagram
3. Rematerialize — the new context package is more precise, output is better

This loop is the system's self-calibration mechanism. Over time, the graph converges on the level of detail that produces consistently good code.

See [Materialization Specification](/spec/materialization) for the full mechanism.

## Drift (Continuous)

**Purpose:** Detect when code was modified outside the graph.

**Tool:** `ygg drift` or `/ygg.drift`

For each node with a `mapping`, drift detection compares file content hashes against the last materialization. When drift is found:

| Resolution | When to use | Action |
|---|---|---|
| **Absorb** | Change was intentional (hotfix, improvement) | Update graph to match code, run `ygg drift --absorb` |
| **Reject** | Change was a mistake or unauthorized | Rematerialize from graph |
| **Defer** | Intentional but not urgent to resolve | Leave as-is (not recommended long-term) |

See [Drift Detection Specification](/spec/drift-detection) for the full mechanism.

## Pipeline Summary

| Stage | Tool | Input | Output | Required? |
|---|---|---|---|---|
| **Brief** | `/ygg.brief` or manual | Natural language | `.briefs/*.md` | Optional |
| **Clarify** | `/ygg.clarify` | Brief file | Updated brief | Optional |
| **Plan** | `/ygg.plan` | Brief + graph | Plan document | Optional |
| **Check** | `ygg check` | Graph files | Issue list | Recommended |
| **Apply** | `/ygg.apply` or manual | Plan / decisions | Modified graph files | Yes |
| **Materialize** | `/ygg.materialize` | Graph + context | Source code + tests | Yes |
| **Drift** | `ygg drift` | Mappings + code | Drift report | Continuous |

**Minimum viable workflow:** Edit graph files → `ygg check` → `ygg build-context` → agent generates code.

---

**Want to see this in action?** See the [Agent Walkthrough](/agent-walkthrough) for a realistic chat session.

**See also:** [CLI Reference](/cli-reference), [Agent Commands](/agent-commands)
