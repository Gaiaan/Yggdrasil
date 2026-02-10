# Agent Commands

Agent commands are markdown files installed by `ygg init`. When you type `/ygg.materialize` in your agent's chat, it reads the command file and follows its instructions — calling the CLI for mechanical work and using AI for code generation. After updating the CLI, run `ygg init --agent <name> --commands-only` to refresh commands without overwriting your config.

## Supported Agents

| Agent | Command Directory | Format | How to invoke |
|---|---|---|---|
| Claude Code | `.claude/commands/` | Markdown (`.md`) | Type `/ygg-brief` in chat |
| Cursor | `.cursor/commands/` | Markdown (`.md`) | Type `/ygg-brief` in chat |
| GitHub Copilot | `.github/agents/` | Markdown (`.agent.md`) | Select agent from **dropdown** in chat |
| Gemini CLI | `.gemini/commands/` | TOML (`.toml`) | Type `/ygg-brief` in chat |

**Note for GitHub Copilot:** Copilot uses Custom Agents, not slash commands. After `ygg init --agent copilot`, open the **agents dropdown** at the bottom of the chat (not the input field) and select the Ygg agent you need (e.g. "/ygg.brief", "/ygg.materialize"). Agents appear once the repo is opened in VS Code with Copilot.

## Command Overview

| Command | Purpose |
|---|---|
| `/ygg.brief` | Gather requirements and create a structured brief |
| `/ygg.clarify` | Analyze a brief and resolve ambiguities |
| `/ygg.plan` | Propose graph changes based on a brief |
| `/ygg.apply` | Create or modify graph files from a plan |
| `/ygg.check` | Run graph validation and report results |
| `/ygg.materialize` | Generate code from graph nodes |
| `/ygg.drift` | Detect and resolve code divergence |
| `/ygg.define` | Define or edit a node conversationally |
| `/ygg.ingest` | Bring existing code into the graph as blackbox nodes |

## Command Format

Each command file follows this structure:

```markdown
---
description: "Short description shown in agent's command picker"
---

# Command Name

## Context
What this command is for. When to use it.

## Prerequisites
What must be true before running this command.

## Workflow
Step-by-step instructions for the agent.

## Rules
Constraints and principles the agent must follow.
```

The frontmatter (`description`) is displayed in the agent's command picker. The body is the instruction set the agent follows.

## How Commands Use the CLI

The pattern is consistent: the **CLI provides data**, the **agent provides intelligence**.

| Command | CLI Tools Used |
|---|---|
| `/ygg.brief` | Creates `.briefs/` files only |
| `/ygg.clarify` | Reads brief files |
| `/ygg.plan` | `ygg tree` (with `--depth`/subtree), `ygg build-context`, `ygg affected` |
| `/ygg.apply` | `ygg check` (after changes) |
| `/ygg.check` | `ygg check` |
| `/ygg.materialize` | `ygg resolve-deps`, `ygg build-context` |
| `/ygg.drift` | `ygg drift` |
| `/ygg.define` | `ygg check` (after creating node) |
| `/ygg.ingest` | `ygg check` (after creating nodes) |

The CLI cannot generate code. The agent should not parse graph files manually when the CLI can do it deterministically. Neither replaces the other.

## Workflow Discipline

**The pipeline is strict: brief → plan → apply.** Never skip steps.

- When the user describes a problem or asks "how to fix X": create a brief first with `/ygg.brief`. Do not implement.
- `/ygg.plan` produces a plan only. Do not implement. Wait for user approval.
- `/ygg.apply` applies only changes from an approved plan. If no plan exists, suggest creating a brief first.

Implementing before plan and apply leads to wasted work and inconsistent state. The agent must follow the sequence.

**Graph as source of truth:** Code is derived from the graph. The graph must hold
complete, concrete knowledge — no placeholders, no "agent will figure out during
materialization". The brief captures everything; the plan specifies artifact content;
/ygg.apply writes it fully to the graph. References to repo docs: use explicit paths.

## Detailed Command Specifications

### /ygg.brief

**Purpose:** Gather requirements from the user and create a structured brief.

**Workflow:**

1. Ask the user to describe what they need (or use the description provided as argument).
2. Structure requirements into sections: Context, Requirements, Acceptance Criteria.
3. Ask 2-3 clarifying questions. Always ask when:
   - The requirement implies a **new data model** (fields? relations? cardinality?)
   - The requirement **affects multiple existing nodes** (which ones? what changes?)
   - There are **architectural choices** that could go either way
   - For each question, provide a **recommended answer** so the user can accept defaults quickly.
4. Save the brief to `.yggdrasil/.briefs/<slug>.md`.
5. Suggest next step: `/ygg.plan`.

**Rules:** Do NOT modify graph files or implement anything. Only create the brief. The brief must be COMPLETE — everything that will go into the graph must be in it. No placeholders, no "TBD". When the user asks "why doesn't X work" or "how to fix X", create a brief first—do not jump to implementation. Keep briefs in natural language. Bias toward asking, not guessing.

---

### /ygg.clarify

**Purpose:** Analyze an existing brief and resolve ambiguities.

**Workflow:**

1. List briefs in `.yggdrasil/.briefs/`. If multiple, ask which one.
2. Read the brief and analyze for ambiguities across categories:
   - Functional scope, edge cases, integration points, constraints, terminology
3. Ask up to 5 questions, one at a time. For each, provide a recommended answer.
4. Append a `## Clarifications` section to the brief with Q&A pairs.

**Rules:** Do NOT modify graph files. Ask questions sequentially. Each clarification must produce a concrete answer appended to the brief. The brief must end up complete for the graph. If the brief is already clear, suggest `/ygg.plan`.

---

### /ygg.plan

**Purpose:** Propose graph changes based on a brief and the current graph state.

**Rules:** Do NOT implement. Only produce a plan. Wait for user approval before /ygg.apply.

**Workflow:**

1. Read the brief (ask user to pick if multiple exist).
2. Explore the graph **progressively** — never run `ygg tree` without depth limits:
   a. `ygg tree --depth 1 --compact` for top-level overview
   b. `ygg tree <module>/ --compact` for affected modules
   c. Go deeper only if needed
3. Run `ygg build-context` for nodes that need detailed understanding.
4. Evaluate granularity — propose splits for nodes that are too coarse.
5. Run `ygg affected <node>` for each modified node to discover downstream impact.
6. Produce a plan: impact analysis, new nodes, modified nodes, new relations, flows, dependency order.
7. Present to user for review.

**Rules:**

- Do NOT create or modify graph files — only produce a plan document. Do NOT implement.
- Specify complete artifact content in the plan. Do not write "add description.md" — write the concrete content each artifact must have. The plan must contain everything /ygg.apply needs to write.
- Proactively suggest splitting oversized nodes.
- Place domain-specific nodes in their domain module. Use relations for cross-domain context.
- Propose flows for processes spanning 3+ nodes across 2+ modules.

---

### /ygg.apply

**Purpose:** Apply planned changes to graph files.

**Rules:** Only apply when there is an approved plan. If no plan exists, suggest creating a brief first.

**Workflow:**

1. Require an approved plan from `/ygg.plan`. If none exists, do NOT implement—suggest brief first.
2. Follow the plan.
3. For each new node: create directory, `node.yaml`, `description.md`, additional artifacts.
4. For each modified node: update `node.yaml` and artifacts as specified.
5. If the plan specifies documentation or template updates, apply those too.
6. Run `ygg check` to validate.

**Rules:**

- Only apply when there is an approved plan. Do not implement ad-hoc.
- Modify graph files in `.yggdrasil/` as specified.
- Write FULL artifact content. No placeholders. The graph is the source of truth;
  code is derived from it. References to repo docs: use explicit paths.
- Never modify source code files (except templates when plan specifies).
- Always run `ygg check` after making changes.
- Write artifact content with enough detail for AI materialization.
- When splitting a node, update parent's `mapping` and set `mapping` on each child.

---

### /ygg.check

**Purpose:** Run graph consistency checks and report results.

**Workflow:**

1. Run `ygg check`.
2. If issues found, explain each one and suggest how to fix it.
3. If no issues, confirm the graph is consistent.

**Rules:** Read-only command. Do not modify files. Suggest fixes but do not apply without confirmation.

---

### /ygg.materialize

**Purpose:** Generate code from graph nodes.

**Workflow:**

1. Determine targets: specific node, `--changed`, or all.
2. Run `ygg resolve-deps` to get dependency-ordered stages.
3. For each stage:
   - **Stages with 2+ nodes: ALWAYS use subagents when available.** Do not process sequentially when parallel execution is possible.
   - For each node: `ygg build-context <path>` → generate code → write to `mapping.path` → run tests.
   - When using subagents, pass: (1) build-context output, (2) most recent brief from `.yggdrasil/.briefs/` for invocation context.
4. Run tests. If tests fail, suggest refining the graph (not editing code).

**Rules:**

- The context package is your SPECIFICATION. You may also read existing code at the node's mapping path(s).
- Do NOT read other modules' code — the relational layer already provides their interfaces.
- Do NOT modify `.yggdrasil/` files. If the spec is wrong, tell the user to update the graph.
- If aspects contain conflicting instructions, stop and ask the user.

---

### /ygg.drift

**Purpose:** Detect and report code divergence from the graph.

**Workflow:**

1. Run `ygg drift`.
2. For each drifted node, show what changed and ask: Absorb or Reject?
3. **Absorb:** help user update artifacts to reflect the code change.
4. **Reject:** add node to rematerialization list, offer `/ygg.materialize`.

**Rules:** Always show drift before asking for a decision. Do not auto-resolve.

---

### /ygg.define

**Purpose:** Interactively define or edit a node through conversation.

**Workflow:**

1. Ask the user: name, location in graph, type, tags, relations, mapping path.
2. Create node directory, `node.yaml`, `description.md`, additional artifacts.
3. Run `ygg check` to validate.

**Rules:** Guide the user but don't require answers to every question. A node with name, type, and description is valid.

---

### /ygg.ingest

**Purpose:** Bring existing code into the graph as blackbox nodes.

**Workflow:**

1. Ask what to ingest (directory path or module name).
2. Scan code: identify classes, services, controllers, call patterns, external dependencies.
3. Group by logical responsibility (not per-file). Target 5-15 nodes per module.
4. For each node: `node.yaml` with `blackbox: true`, `description.md` (honest!), `interface.md` for public APIs.
5. Create relations based on discovered call patterns. Create infra nodes (databases, caches, APIs) as blackbox without mapping.
6. Propose flows for end-to-end processes spanning 3+ nodes.
7. Present proposal, wait for approval, create files, run `ygg check`.

**Rules:**

- All ingested nodes are `blackbox: true`. The user decides later which to un-blackbox.
- Describe code as it IS, not as it should be. "800 LOC God class with switch-case routing" is more useful than "Notification routing service."
- Do not modify any source code. Only create graph files.
- For large codebases, ingest one module at a time.

## Workflow Mapping

| Stage | Agent Command |
|---|---|
| Brief | `/ygg.brief` |
| Clarify | `/ygg.clarify` |
| Plan | `/ygg.plan` |
| Apply | `/ygg.apply` |
| Check | `/ygg.check` |
| Materialize | `/ygg.materialize` |
| Drift | `/ygg.drift` |

**Ad-hoc:** `/ygg.define` for conversational node creation, `/ygg.ingest` for brownfield adoption.

---

**Want to see these commands in action?** See the [Agent Walkthrough](/agent-walkthrough).

**See also:** [Workflow](/workflow), [CLI Reference](/cli-reference)
