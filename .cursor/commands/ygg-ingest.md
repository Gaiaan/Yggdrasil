---
description: 'Ingest existing code into the graph as blackbox nodes'
handoffs:
  - command: /ygg.plan
    label: 'Plan changes'
    prompt: 'Run /ygg.plan to plan changes using the ingested graph.'
cli_tools:
  - ygg check
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
  graph files in .yggdrasil/.
- If the codebase is large, ingest one module at a time. Do not try
  to ingest an entire solution in one pass.
