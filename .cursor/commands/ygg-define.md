---
description: "Define or edit a graph node conversationally"
handoffs:
  - command: /ygg.materialize
    label: "Materialize"
    prompt: "Run /ygg.materialize to generate code for this node."
cli_tools:
  - ygg check
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
