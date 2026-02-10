# 07 — Agent Commands: `/ygg.*`

## What Agent Commands Are

Agent commands are **markdown files** installed into the AI agent's command directory. They contain instructions that tell the agent how to execute a workflow, which CLI tools to use, and what rules to follow.

When a user types `/ygg.materialize` in Cursor's chat or Claude Code's terminal, the agent reads the corresponding markdown file and follows its instructions. The agent does the AI work (reasoning, generating code, making decisions). The CLI does the mechanical work (building context, resolving dependencies, checking consistency).

Agent commands are the **glue** between the CLI toolset and the AI agent. They translate Yggdrasil's workflow into instructions the agent can follow.

---

## Installation

Agent commands are installed by `ygg init`:

| Agent | Command Directory | File Format |
|---|---|---|
| Claude Code | `.claude/commands/` | Markdown (`.md`) |
| Cursor | `.cursor/commands/` | Markdown (`.md`) |
| Gemini CLI | `.gemini/commands/` | TOML (`.toml`) |
| GitHub Copilot | `.github/agents/` | Markdown (`.md`) |

The command files are bundled with the `@yggdrasil/cli` npm package and copied to the appropriate directory during initialization.

---

## Command Format (Markdown)

Each command follows this structure:

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

The frontmatter (`description`) is used by the agent's UI to show a short label. The body is the actual instruction set.

---

## Command Reference

### `/ygg.brief`

**Purpose:** Gather requirements from the user and create a structured brief.

```markdown
---
description: "Gather requirements and create a brief for graph changes"
---

# /ygg.brief

## Context
Use this command when the user has a new requirement, feature request,
bug report, or idea that should be processed through the Yggdrasil graph.

## Workflow

1. Ask the user to describe what they need. If they already provided a
   description as an argument, use that.

2. Structure the requirements into sections:
   - **Context**: Why this is needed
   - **Requirements**: What must be done (as a bullet list)
   - **Acceptance Criteria**: How to verify it is done correctly

3. Ask 2-3 clarifying questions. Always ask when:
   - The requirement implies a **new data model** (what fields? what relations?
     flat or nested? one-to-many or many-to-many?)
   - The requirement **affects multiple existing nodes** (which ones change?
     what exactly changes in each?)
   - There are **architectural choices that could go either way**
     (separate page vs. modal, client state vs. server state, etc.)
   For each question, provide a **recommended answer** based on common
   practice so the user can accept defaults quickly ("I recommend X because Y.
   Want to go with that?").
   If the user's description is already precise on all of these, say so
   and skip to step 4.

4. Save the brief to `yggdrasil/.briefs/<slug>.md` where slug is a
   short kebab-case name derived from the description.

5. Inform the user: "Brief created. Run /ygg.plan to propose graph changes."

## Rules
- Do NOT modify any graph files (node.yaml, artifacts). This command only creates briefs.
- Keep the brief in natural language. Do not reference node paths or graph structure.
- If the user's description is already well-structured, do not force additional questions.
- When in doubt, ask. A wrong architectural assumption costs more than one extra question. Bias toward asking, not guessing — but always offer a recommended answer so the user can move fast.
```

---

### `/ygg.clarify`

**Purpose:** Analyze an existing brief and resolve ambiguities.

```markdown
---
description: "Analyze a brief and ask clarifying questions"
---

# /ygg.clarify

## Context
Use this command to refine a brief before planning graph changes.
Identifies ambiguities and asks targeted questions.

## Workflow

1. List brief files in `yggdrasil/.briefs/`. If multiple exist,
   ask the user which one to clarify.

2. Read the brief file.

3. Analyze for ambiguities across these categories:
   - Functional scope (what exactly is included/excluded)
   - Edge cases (error conditions, boundary values)
   - Integration points (which existing parts of the system are involved)
   - Constraints (performance, security, business rules)
   - Terminology (domain terms that could be misinterpreted)

4. Ask up to 5 questions, one at a time. For each question:
   - State the ambiguity clearly
   - Provide a recommended answer based on common practice
   - Wait for the user's response

5. After each answer, append a `## Clarifications` section to the brief
   with the Q&A pair.

6. After all questions are resolved:
   "Brief clarified. Run /ygg.plan to propose graph changes."

## Rules
- Do NOT modify graph files. Only modify the brief file.
- Ask questions sequentially, not all at once.
- If the brief is already clear, say so and suggest moving to /ygg.plan.
```

---

### `/ygg.plan`

**Purpose:** Propose graph changes based on a brief and the current graph state.

```markdown
---
description: "Propose graph changes based on a brief"
---

# /ygg.plan

## Context
Analyzes a brief against the current graph and proposes specific changes:
new nodes, modified nodes, new relations, updated artifacts.

## Prerequisites
- At least one brief file exists in `yggdrasil/.briefs/`

## Workflow

1. Read the brief (ask user to pick if multiple exist).

2. Explore the graph structure progressively — do NOT run `ygg tree`
   without depth limits, as large graphs will flood your context:
   a. Run `ygg tree --depth 1 --compact` to see top-level modules.
   b. Based on the brief, identify which modules are likely affected.
   c. For each affected module, run `ygg tree <module>/ --compact` to
      see its internal structure.
   d. Only go deeper (`ygg tree <module>/<subpath>/`) if needed.

3. For modules likely affected, run `ygg build-context <node>` to
   understand their current state.

4. Evaluate granularity of affected nodes:
   - If an existing node has many artifacts, a large description, or maps
     to a large code file — it may be too coarse for the new requirements.
   - If adding the brief's requirements would make a node significantly
     more complex, propose splitting it into child nodes as part of the plan.
   - If a node was created in a previous session as a coarse placeholder,
     and the new requirements target a specific part of it, propose
     extracting that part into a dedicated child node.
   - Always explain *why* you recommend a split. The user decides.

5. For each node that is modified or has new relations, run
   `ygg affected <node>` to discover downstream impact — other nodes
   and flows that depend on the changed node.

6. Produce a plan with:
   - **Impact Analysis**: which existing nodes are affected, including
     downstream dependents discovered via `ygg affected`
   - **New Nodes**: directories to create, with proposed type, tags, relations
   - **Modified Nodes**: which existing node.yaml or artifacts need changes
   - **New Relations**: connections between new and existing nodes
   - **New/Updated Flows**: if the brief describes a process spanning 3+ nodes
     across 2+ modules, propose creating a flow in `yggdrasil/flows/`
   - **Dependency Order**: in what order should new nodes be materialized

7. Present the plan to the user for review.

8. After user approval:
   "Plan approved. Run /ygg.apply to create the graph changes,
    or edit the files manually."

## Rules
- Do NOT create or modify graph files in this command. Only produce a plan document.
- Always explore the graph tree first, but progressively: start with
  `ygg tree --depth 1 --compact`, then drill into relevant modules.
  Never run `ygg tree` without `--depth` on a graph you have not seen before.
- Use `ygg build-context` for nodes you need to understand in detail.
- Use `ygg affected <node>` for every modified node to discover downstream impact.
- The plan is a proposal. The user decides what to accept.
- Proactively suggest splitting nodes that are too coarse. A node that tries to describe too much produces poor materialization. Better to propose a split now than to debug bad code later.
- When proposing a split of a node that already has materialized code, note that existing code will need rematerialization as smaller files. This is graph refactoring — it precedes code refactoring.
- Place domain-specific nodes in their domain module (e.g., `shop/product-card/`, not `ui/product-card/`). Place generic reusable nodes in shared modules (e.g., `ui/data-table/`). Use relations to provide cross-domain context.
- If the brief describes a process spanning 3+ nodes across 2+ modules, propose creating a flow in `yggdrasil/flows/`. If a relevant flow already exists, propose updating it.
```

---

### `/ygg.apply`

**Purpose:** Apply planned changes to the graph files (and documentation when specified).

```markdown
---
description: "Apply graph changes from a plan or instructions"
---

# /ygg.apply

## Context
Creates and modifies graph files according to a plan or user instructions.
When the plan specifies documentation or template updates, applies those too.
This is the command that actually changes the graph.

## Workflow

1. If a plan was created with /ygg.plan, follow it.
   If no plan exists, ask the user what changes to make.

2. For each new node:
   a. Create the directory under `.yggdrasil/`
   b. Create `node.yaml` with: name, type, tags (if any), relations (if any), mapping (if known)
   c. Create essential artifacts:
      - `description.md` — what the node does, responsibilities, edge cases
      - Additional artifacts as specified in the plan (constraints.md, interface.yaml, etc.)

3. For each modified node:
   a. Update `node.yaml` as needed
   b. Update or create artifacts as specified

4. If the plan specifies documentation changes (e.g. in `documentation/`, `docs/`,
   or agent command templates), apply those changes too. Keep documentation
   consistent with graph and command changes.

5. Run `ygg check` to validate the graph after changes.

6. If check passes: "Graph updated. Run /ygg.materialize to generate code."
   If check finds issues: report them and fix.

## Rules
- Modify graph files in `.yggdrasil/` as specified in the plan.
- When the plan specifies documentation or template updates, apply those too.
  Do not leave documentation out of sync with the changes.
- Never modify source code files (except templates when the plan specifies).
- Always run `ygg check` after making changes.
- Write artifact content with enough detail for an AI agent to materialize correctly.
  Think: "What would I need to know to implement this?"
- For `node.yaml`, only include structural metadata. Descriptions, constraints,
  and interfaces belong in artifacts.
- When splitting a node into children, update the parent's `mapping` (remove or
  adjust it) and set `mapping` on each new child node. Note that existing code
  at the old mapping path will need rematerialization as separate, smaller files.
```

---

### `/ygg.check`

**Purpose:** Run graph consistency checks and report results.

```markdown
---
description: "Validate graph consistency"
---

# /ygg.check

## Workflow

1. Run `ygg check`.
2. If issues found, explain each one and suggest how to fix it.
3. If no issues, confirm the graph is consistent.

## Rules
- This is a read-only command. Do not modify any files.
- If you can fix an issue automatically (e.g., a typo in a relation target), suggest the fix but do not apply without user confirmation.
```

---

### `/ygg.materialize`

**Purpose:** Generate code from graph nodes.

```markdown
---
description: "Materialize graph nodes into source code"
---

# /ygg.materialize

## Context
Generates implementation code and tests from graph nodes.
Uses build-context to get precise context for each node,
then generates code that respects the specification.

## Workflow

1. Determine what to materialize:
   - If user specifies a node: that node
   - If user says "all changed": run `ygg resolve-deps --changed`
   - If user says "all": run `ygg resolve-deps`

2. Run `ygg resolve-deps` (with appropriate flags) to get the
   dependency-ordered stage list.

3. For each stage in order:
   For stages with 2+ nodes: ALWAYS use subagents when your agent supports
   them. Do not process nodes sequentially when parallel execution is available.
   If the agent does not support subagents, process sequentially.

   For each node in the stage (nodes within a stage are independent):
   a. Run `ygg build-context <node-path>`
   b. If using a subagent: pass (1) the build-context output, (2) the
      contents of the most recent brief in `.yggdrasil/.briefs/` if any
      exist. Subagents need the invocation context (why we are implementing
      this node), not just the specification.
   c. Read the context package output
   d. Generate implementation code that:
      - Follows the global standards from the context
      - Implements the behavior described in node artifacts
      - Respects interfaces of dependencies
      - Follows cross-cutting requirements from aspects
   e. Generate tests that verify:
      - Constraints from artifact files
      - Interface contracts
      - Business rules
   f. Write code to the location in `mapping.path` from node.yaml
   g. Write tests co-located with code (per project standards)

4. After all nodes are materialized, run tests.

5. If tests pass: "Materialization complete. All tests pass."
   If tests fail: report which node's tests failed and suggest
   refining the graph (adding detail, splitting nodes, adding constraints).

## Rules
- The context package from build-context is your SPECIFICATION — it defines
  what the code should do. You may also read existing code at the node's
  mapping path(s) to decide whether to update incrementally or rewrite from
  scratch. Do NOT read other modules' code — the context package already
  contains their interfaces via the relational layer.
- Do NOT modify files in yggdrasil/. If something is wrong with the spec,
  tell the user to update the graph.
- If you cannot implement a node correctly from its context, say so.
  The fix is a better graph description, not a workaround in code.
- If aspects in the context package contain conflicting instructions,
  stop and ask the user which takes priority before proceeding.
  Do not silently pick one interpretation.
- For stages with 2+ nodes, ALWAYS use subagents when your agent supports
  them. Do not process sequentially when parallel execution is available.
- When spawning a subagent, pass: (1) the build-context output for that node,
  (2) the contents of the most recent brief in `.yggdrasil/.briefs/` if any
  exist. Subagents need the invocation context to understand why they are
  implementing this node.
```

---

### `/ygg.drift`

**Purpose:** Detect and report code divergence from the graph.

```markdown
---
description: "Detect code changes made outside the graph"
---

# /ygg.drift

## Workflow

1. Run `ygg drift`.

2. For each node with drift:
   - Show which file changed and a summary of what changed
   - Ask the user: "Absorb (update graph to match code) or
     Reject (rematerialize from graph)?"

3. For "Absorb": help the user update the relevant artifacts in yggdrasil/
   to reflect the code change.

4. For "Reject": add the node to the rematerialization list and
   offer to run /ygg.materialize.

## Rules
- Always show the drift before asking for a decision.
- Do not automatically resolve drift. The user decides.
```

---

### `/ygg.define`

**Purpose:** Interactively define or edit a node.

```markdown
---
description: "Define or edit a graph node conversationally"
---

# /ygg.define

## Context
Use when the user wants to create a new node or modify an existing one
through conversation rather than editing files directly.

## Workflow

1. Ask the user:
   - What is this node? (name, what it does)
   - Where in the graph? (parent node, or new top-level)
   - What type? (module, service, component, interface, etc.)
   - Any tags?
   - Any relations to existing nodes?
   - Where will the code live? (mapping path)

2. Create the node directory and files:
   - `node.yaml` with metadata
   - `description.md` with what the user described
   - Additional artifacts as the conversation develops

3. Run `ygg check` to validate.

## Rules
- Guide the user but do not require answers to every question.
  A node with just a name, type, and description is valid.
- Show the user what you created. Let them adjust.
```

---

### `/ygg.ingest`

**Purpose:** Bring existing code into the graph as blackbox nodes.

```markdown
---
description: "Ingest existing code into the graph as blackbox nodes"
---

# /ygg.ingest

## Context
Use this command to bring existing code into the Yggdrasil graph.
You read the code, analyze its structure, and create blackbox nodes
that describe what exists. This is the entry point for brownfield
adoption — the graph becomes a map of existing code that provides
context for future work.

## Workflow

1. Ask the user what to ingest:
   - A directory path (e.g., `src/NotificationService/`)
   - A project or module name
   - If the user already provided a path as an argument, use that.

2. Scan the code at the given path:
   - Read source files to understand structure
   - Identify classes, services, controllers, repositories, models
   - Map call patterns: what calls what, what reads from where
   - Identify external dependencies: databases, queues, APIs, caches

3. Group code into logical responsibilities. Do NOT create one node
   per class. Group related classes that serve a single purpose:
   - "SMS sending" (SmsService + related helpers)
   - "Queue handling" (Publisher + Consumer)
   - "Template management" (Engine + Repository)
   A good grouping produces 5-15 nodes for a typical module.

4. For each proposed node, prepare:
   - `node.yaml` with `blackbox: true`, mapping to actual source files
   - `description.md` — HONEST description of what the code does.
     Include problems: "God class", "duplicated logic", "hardcoded values",
     "bypasses repository", "no error handling", "untested".
     The graph must describe reality, not aspirations.
     Flag candidates for future decomposition with ⚠.
   - `interface.md` (for nodes with public APIs) — methods, endpoints,
     signatures that other code calls. This is the most valuable artifact
     for context building.

5. Create relations between nodes based on discovered call patterns.
   Create infra dependency nodes (databases, caches, queues, external APIs)
   as blackbox nodes without mapping — they provide context via relations.

6. If the code has end-to-end processes spanning 3+ nodes
   (e.g., API → Dispatcher → Queue → Provider → Log), propose a flow.

7. Present the full proposal to the user:
   - Show the tree of proposed nodes
   - Highlight problems and decomposition candidates
   - Wait for approval before creating files

8. After approval, create all nodes and run `ygg check`.

## Rules
- All nodes created by ingest are `blackbox: true`. The user decides
  later which to un-blackbox and manage through the graph.
- Describe code as it IS, not as it should be. Honest descriptions
  enable better decisions. "800 LOC God class with switch-case routing"
  is more useful than "Notification routing service."
- Group by responsibility, not by file. One node can map to multiple files.
  One file should not be split across multiple nodes at ingest time.
- Always create interface artifacts for nodes that expose public APIs.
  Other nodes will consume them via relations during context building.
- Do not modify any existing source code. This command only creates
  graph files in yggdrasil/.
- If the codebase is large, ingest one module at a time. Do not try
  to ingest an entire solution in one pass.
```

---

## How Agent Commands Use CLI Tools

The pattern is consistent across all commands:

```
Agent reads command markdown → follows instructions → calls ygg CLI as needed → does AI work
```

The CLI provides **data** (context packages, dependency orders, validation results, drift reports). The agent provides **intelligence** (generating code, making decisions, conversing with the user).

Neither replaces the other. The CLI cannot generate code. The agent should not parse graph files manually when the CLI can do it deterministically.
