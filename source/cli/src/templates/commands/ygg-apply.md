---
description: "Apply graph changes from a plan or instructions"
handoffs:
  - command: /ygg.materialize
    label: "Materialize code"
    prompt: "Run /ygg.materialize to generate code from the graph."
cli_tools:
  - ygg check
---

# /ygg.apply

## Context

Creates and modifies graph files according to a plan or user instructions.
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
   or agent command templates in `source/cli/src/templates/commands/`), apply
   those changes too. Keep documentation consistent with graph and command changes.

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
