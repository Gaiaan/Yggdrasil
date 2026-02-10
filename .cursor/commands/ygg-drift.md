---
description: "Detect code changes made outside the graph"
handoffs:
  - command: /ygg.materialize
    label: "Rematerialize (reject)"
    prompt: "Run /ygg.materialize to restore code from graph."
  - command: /ygg.apply
    label: "Update graph (absorb)"
    prompt: "Update the graph artifacts to reflect the code change."
cli_tools:
  - ygg drift
---

# /ygg.drift

## Workflow

1. Run `ygg drift`.

2. For each node with drift:
   - Show which file changed and a summary of what changed
   - Ask the user: "Absorb (update graph to match code) or
     Reject (rematerialize from graph)?"

3. For "Absorb": help the user update the relevant artifacts in .yggdrasil/
   to reflect the code change.

4. For "Reject": add the node to the rematerialization list and
   offer to run /ygg.materialize.

## Rules
- Always show the drift before asking for a decision.
- Do not automatically resolve drift. The user decides.
