# Agent Walkthrough

A realistic chat session showing the full Yggdrasil command flow — from gathering requirements to generating code. This example uses Cursor, but the same commands work in Claude Code, Gemini CLI, or GitHub Copilot.

**Scenario:** You are building an e-commerce platform. The auth module exists in the graph. A product owner asks for a password reset feature.

---

## Step 1: Brief — capturing the requirement

> **You:** `/ygg.brief` I need a password reset feature. User clicks "Forgot password", gets an email with a reset link, clicks it, enters new password. Link should expire after 24h. Max 3 requests per hour per email.

> **Agent:** I'll structure this into a brief. A couple of questions first:
>
> 1. **Should the reset link be one-time use?** I recommend yes — once clicked, the link is consumed and cannot be reused. Want to go with that?
> 2. **What happens if the email is not in our system?** I recommend showing the same "check your email" message to prevent email enumeration attacks. Agree?
> 3. **After reset, should existing sessions be invalidated?** I recommend yes — force re-login on all devices. Sound good?

> **You:** Yes to all three.

> **Agent:** Brief created at `.yggdrasil/.briefs/password-reset.md`:
>
> ```markdown
> # Password Reset via Email
>
> ## Context
> Users need to recover access when they forget their password.
>
> ## Requirements
> - User clicks "Forgot password" and enters email
> - System sends a reset link valid for 24 hours
> - Reset link is one-time use
> - User clicks link, enters new password
> - After reset, all existing sessions are invalidated
> - Same response shown whether email exists or not (prevent enumeration)
>
> ## Acceptance Criteria
> - Reset link expires after 24h
> - Maximum 3 reset requests per hour per email
> - Reset email sent within 30 seconds
> ```
>
> Run `/ygg.plan` to propose graph changes.

---

## Step 2: Plan — proposing graph changes

> **You:** `/ygg.plan`

> **Agent:** Reading brief `password-reset.md`... Let me explore the graph.
>
> *Running `ygg tree --depth 1 --compact`:*
>
> ```
> My E-Commerce System
> ├── auth/ (module) [requires-audit]
> ├── users/ (module)
> ├── orders/ (module)
> └── notifications/ (module)
> ```
>
> Auth and notifications look relevant. Let me look deeper.
>
> *Running `ygg tree auth/ --compact`:*
>
> ```
> auth/ (module) [requires-audit]
> ├── login-service/ (service)
> ├── session-manager/ (service)
> └── auth-api/ (interface) [public-api]
> ```
>
> *Running `ygg tree notifications/ --compact`:*
>
> ```
> notifications/ (module)
> └── email-service/ (service)
> ```
>
> *Running `ygg affected auth/auth-api/`:*
>
> ```
> Nodes depending on auth/auth-api/:
>   - orders/order-service/ (uses)
>   - users/user-profile/ (uses)
> ```
>
> Here's my plan:
>
> ### Plan: Password Reset
>
> **Impact Analysis:**
>
> - Affected module: auth/
> - New nodes: 2
> - Modified nodes: 1 (auth-api — new endpoints)
> - Downstream impact: orders/order-service and users/user-profile depend on auth-api but are not affected (no API changes to existing endpoints)
>
> **New: auth/password-reset-service/**
>
> - Type: service
> - Tags: requires-auth, requires-audit
> - Relations: → users/user-repository (reads), → notifications/email-service (uses), → auth/session-manager (uses)
> - Artifacts: description.md, constraints.md
> - Mapping: src/modules/auth/password-reset.service.ts
>
> **New: auth/password-reset-token/**
>
> - Type: model
> - Artifacts: description.md (token format, expiry, one-time use logic)
> - Mapping: src/modules/auth/password-reset-token.model.ts
>
> **Modified: auth/auth-api/**
>
> - Add endpoints: POST /auth/reset-password, POST /auth/reset-password/confirm
> - Update: openapi.yaml
>
> **Dependency order:**
>
> 1. auth/password-reset-token (no deps)
> 2. auth/password-reset-service (depends on token, user-repo, email-service, session-manager)
> 3. auth/auth-api (depends on password-reset-service)
>
> Approve this plan?

> **You:** Looks good. Go ahead.

> **Agent:** Plan approved. Run `/ygg.apply` to create the graph changes.

---

## Step 3: Apply — creating graph files

> **You:** `/ygg.apply`

> **Agent:** Applying the plan...
>
> Created `auth/password-reset-token/`:
>
> - `node.yaml`: type: model, mapping to src/modules/auth/password-reset-token.model.ts
> - `description.md`: Token contains userId, token hash (sha256), createdAt, expiresAt, usedAt. One-time use: usedAt is set on consumption, subsequent attempts rejected.
>
> Created `auth/password-reset-service/`:
>
> - `node.yaml`: type: service, tags: [requires-auth, requires-audit], relations to user-repo, email-service, session-manager, password-reset-token
> - `description.md`: Handles reset request (generate token, send email), and reset confirmation (validate token, update password, invalidate sessions). Rate limiting: 3 requests/hour/email.
> - `constraints.md`: Rate limits, token expiry (24h), email enumeration prevention (always return 200), email delivery SLA (30s).
>
> Modified `auth/auth-api/`:
>
> - Updated `openapi.yaml` with POST /auth/reset-password and POST /auth/reset-password/confirm
>
> *Running `ygg check`:*
>
> ```
> ✓ 12 nodes found
> ✓ All relation targets valid
> ✓ All tags defined
> ✓ No circular relations
> ✓ All mappings unique
>
> 0 issues.
> ```
>
> Graph updated. Run `/ygg.materialize` to generate code.

---

## Step 4: Materialize — generating code

> **You:** `/ygg.materialize`

> **Agent:** Determining what to materialize...
>
> *Running `ygg resolve-deps --changed`:*
>
> ```
> Stage 1 (parallel):
>   - auth/password-reset-token
>
> Stage 2 (parallel):
>   - auth/password-reset-service
>
> Stage 3:
>   - auth/auth-api
> ```
>
> **Stage 1:** Materializing `auth/password-reset-token`...
>
> *Running `ygg build-context auth/password-reset-token`*
>
> Generated `src/modules/auth/password-reset-token.model.ts` — Entity with fields: id, userId, tokenHash, createdAt, expiresAt, usedAt. Methods: isExpired(), isUsed(), consume().
>
> Generated `src/modules/auth/password-reset-token.model.spec.ts` — Tests for expiry logic, one-time use, consumption.
>
> **Stage 2:** Materializing `auth/password-reset-service`...
>
> *Running `ygg build-context auth/password-reset-service`*
>
> Generated `src/modules/auth/password-reset.service.ts` — requestReset(email): rate-check, generate token, hash it, store, send email via EmailService. confirmReset(token, newPassword): validate token, update password via UserRepository, invalidate sessions via SessionManager, consume token.
>
> Generated `src/modules/auth/password-reset.service.spec.ts` — Tests for rate limiting, token expiry, session invalidation, email enumeration prevention, happy path.
>
> **Stage 3:** Materializing `auth/auth-api`...
>
> *Running `ygg build-context auth/auth-api`*
>
> Updated `src/modules/auth/auth.controller.ts` — Added POST /auth/reset-password and POST /auth/reset-password/confirm endpoints.
>
> Running tests...
>
> ```
> ✓ password-reset-token.model.spec.ts (5 tests passed)
> ✓ password-reset.service.spec.ts (8 tests passed)
> ✓ auth.controller.spec.ts (12 tests passed)
> ```
>
> Materialization complete. All tests pass.

---

## Step 5: Drift — catching a hotfix

*A few days later, a developer quick-fixes the rate limit from 3 to 5 directly in the code...*

> **You:** `/ygg.drift`

> **Agent:** *Running `ygg drift`:*
>
> ```
> auth/password-reset-service → src/modules/auth/password-reset.service.ts
>   ✗ DRIFT: file modified since last materialization
>
> 1 node with drift detected.
> ```
>
> I see the change: the rate limit constant was changed from 3 to 5 requests per hour. This differs from the graph (constraints.md says max 3).
>
> **Absorb** (update graph to say 5/hour) or **Reject** (rematerialize to restore 3/hour)?

> **You:** Absorb — the product team asked for this.

> **Agent:** Updated `.yggdrasil/auth/password-reset-service/constraints.md`:
>
> - Changed "Maximum 3 reset requests per hour per email" to "Maximum 5 reset requests per hour per email"
>
> Running `ygg drift --absorb auth/password-reset-service`...
>
> Drift resolved. Graph and code are in sync.

---

## Summary

| Step | Command | What happened |
|---|---|---|
| 1 | `/ygg.brief` | Captured requirements, asked clarifying questions |
| 2 | `/ygg.plan` | Explored graph, proposed 2 new nodes + 1 modified |
| 3 | `/ygg.apply` | Created node directories, YAML, artifacts, validated |
| 4 | `/ygg.materialize` | Generated code in dependency order, tests passed |
| 5 | `/ygg.drift` | Detected hotfix, absorbed change into graph |

The key insight: the agent never searched through the codebase. It received a **precise context package** for each node and generated code from that specification. The graph was the single source of truth throughout.

---

**Ready to try it yourself?** Start with [Getting Started](/getting-started).

**Learn more:** [Workflow](/workflow), [Agent Commands](/agent-commands), [CLI Reference](/cli-reference)
