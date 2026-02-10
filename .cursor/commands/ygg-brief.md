---
description: "Gather requirements and create a brief for graph changes"
handoffs:
  - command: /ygg.clarify
    label: "Clarify the brief"
    prompt: "Run /ygg.clarify to resolve ambiguities in this brief."
  - command: /ygg.plan
    label: "Plan graph changes"
    prompt: "Run /ygg.plan to propose graph changes based on this brief."
cli_tools: []
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

4. Save the brief to `.yggdrasil/.briefs/<slug>.md` where slug is a
   short kebab-case name derived from the description.

5. Inform the user: "Brief created. Run /ygg.plan to propose graph changes."

## Rules

- Do NOT modify any graph files (node.yaml, artifacts). This command only creates briefs.
- Keep the brief in natural language. Do not reference node paths or graph structure.
- If the user's description is already well-structured, do not force additional questions.
- When in doubt, ask. A wrong architectural assumption costs more than one extra question. Bias toward asking, not guessing — but always offer a recommended answer so the user can move fast.
