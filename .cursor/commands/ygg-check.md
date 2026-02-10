---
description: "Validate graph consistency"
handoffs:
  - command: /ygg.apply
    label: "Fix issues"
    prompt: "Fix the issues found by ygg check."
cli_tools:
  - ygg check
---

# /ygg.check

## Workflow

1. Run `ygg check`.
2. If issues found, explain each one and suggest how to fix it.
3. If no issues, confirm the graph is consistent.

## Rules
- This is a read-only command. Do not modify any files.
- If you can fix an issue automatically (e.g., a typo in a relation target), suggest the fix but do not apply without user confirmation.
