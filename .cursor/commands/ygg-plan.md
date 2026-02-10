---
description: "Propose graph changes based on a brief"
handoffs:
  - command: /ygg.apply
    label: "Apply changes"
    prompt: "Run /ygg.apply to create the graph files."
cli_tools:
  - ygg tree
  - ygg build-context
  - ygg affected
---

# /ygg.plan

## Context

Analyzes a brief against the current graph and proposes specific changes:
new nodes, modified nodes, new relations, updated artifacts.

## Prerequisites

- At least one brief file exists in `.yggdrasil/.briefs/`

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
     across 2+ modules, propose creating a flow in `.yggdrasil/flows/`
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
- If the brief describes a process spanning 3+ nodes across 2+ modules, propose creating a flow in `.yggdrasil/flows/`. If a relevant flow already exists, propose updating it.
