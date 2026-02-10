---
description: "Analyze a brief and ask clarifying questions"
handoffs:
  - command: /ygg.plan
    label: "Plan graph changes"
    prompt: "Run /ygg.plan to propose graph changes."
cli_tools: []
---

# /ygg.clarify

## Context

Use this command to refine a brief before planning graph changes.
Identifies ambiguities and asks targeted questions.

## Workflow

1. List brief files in `.yggdrasil/.briefs/`. If multiple exist,
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
