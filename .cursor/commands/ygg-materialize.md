---
description: "Materialize graph nodes into source code"
handoffs:
  - command: /ygg.drift
    label: "Check for drift"
    prompt: "Run /ygg.drift to verify code matches graph."
cli_tools:
  - ygg resolve-deps
  - ygg build-context
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
- Do NOT modify files in .yggdrasil/. If something is wrong with the spec,
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
