# Vision and Motivation

## The Problem

Software development in 2026 faces a paradox. AI models can generate code, but the way we use them reproduces the limitations of human development processes.

### Why Current AI Tools Hit a Wall

**1. The context problem.** AI agents (Cursor Agent, Claude Code, Copilot, SpecKit, and similar) operate directly on code. As the codebase grows, the agent loses the ability to understand the whole. Context becomes too large — the agent sees trees but not the forest. Even tools like SpecKit that are good at refining requirements fall apart during implementation on complex code because the context is too big for the agent to navigate effectively.

**2. No persistent model.** An agent operating on code has no "map" of the system. Each session starts from zero or from fragmentary context. There is no formal, verifiable representation of what the system _is_ — only code that serves simultaneously as specification and implementation.

**3. Uncontrolled mutations.** An agent editing code directly can introduce changes that are locally correct but globally destructive. Without a formal model there are no constraints — the agent does not know what it must not touch because that information is not recorded anywhere.

**4. Human oversight does not scale.** On a large project a human cannot verify every line of AI-generated code. But a human _can_ verify architecture, requirements, and constraints at a higher level of abstraction.

**5. Documentation drifts from code.** In traditional processes, architectural documentation is created at the start and then gradually becomes stale. Code becomes the only source of truth, but it is too low-level to serve as a specification.

### What Existing Tools Get Right — and Where They Stop

| Tool Category                                     | Strength                                       | Fundamental Limitation                                                                 |
| ------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Code agents** (Cursor, Claude Code, Copilot)    | Fast start, good for small isolated changes    | Context degrades with project size; no system model                                    |
| **Spec-driven tools** (SpecKit)                   | Good at refining requirements conversationally | Flat specification; no architecture model; agent still searches raw code to implement  |
| **Plan+Ask+Agent** (Cursor modes)                 | Planning before implementation                 | Plans are ephemeral (lost after session); implementation still suffers context problem |
| **Architecture diagrams** (Structurizr, IcePanel) | Beautiful visualizations                       | Not executable; diagrams do not produce code or tests                                  |
| **Low-code platforms** (OutSystems, Mendix)       | Fast for simple apps                           | Closed ecosystem; vendor lock-in; not real code                                        |

Every tool listed above shares one thing: **the agent ultimately operates on code**, either directly or through an unstructured intermediary. The code is both the specification and the implementation, and as it grows, every tool degrades.

---

## The Thesis

> **Software should not be written. It should be materialized from a formal, verifiable description — a graph of architectural objects with precise context.**

The key insight: AI agents do not need to see the entire codebase. They need to see **exactly the right context** for the piece they are working on — and nothing else. A small, precise context beats a massive, noisy one every time.

---

## What Yggdrasil Is

Yggdrasil is a **toolset for graph-driven software development**. It introduces a formal intermediate layer — a **graph of nodes** — between human intent and generated code.

The graph lives as files in your repository (`.yggdrasil/` directory). Each node is a directory containing a metadata file (`node.yaml`) and documentation artifacts (markdown, diagrams, contracts — whatever describes the node). The directory hierarchy _is_ the parent-child structure. Relations between nodes are declared in metadata. Tags connect nodes to cross-cutting aspects.

A CLI tool (`ygg`) provides pure mechanical operations on the graph: building context packages, resolving dependencies, checking consistency, detecting drift. It requires no API keys and talks to no AI.

Agent commands (`/ygg.*`) are markdown files installed into your AI agent's command directory (`.claude/commands/`, `.cursor/commands/`, etc.). They instruct the agent how to use the CLI tools in structured workflows — from gathering requirements through to code materialization.

The agent (Cursor, Claude Code, Gemini CLI — whatever you use) does the AI work: conversing with the user, generating code, writing tests. Yggdrasil gives it the right context to do that work well.

```
Human / AI Supervisor
        │ edits graph files, triggers workflows
        ▼
┌──────────────────────────┐
│   .yggdrasil/ (files)    │  The graph: directories = nodes,
│   node.yaml + artifacts  │  files = documentation,
│   git diff = changeset   │  git = versioning
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│   ygg CLI (npm i -g)     │  Pure toolset: build-context,
│   No AI, no API keys     │  resolve-deps, check, drift
└──────────┬───────────────┘
           │ agent calls CLI as tool
           ▼
┌──────────────────────────┐
│   Agent (Cursor / Claude │  Has API keys, talks to LLM,
│   Code / Gemini / ...)   │  generates code using context
│   Reads /ygg.* commands  │  packages from CLI
└──────────────────────────┘
```

---

## Value Proposition

### For Architects and Senior Developers

- You work at your natural level of abstraction: modules, interfaces, constraints, relations.
- The system materializes your architectural decisions into working code.
- You verify the graph, not thousands of lines of generated code.

### For Teams with Existing Codebases

- You can incrementally overlay the graph on parts of your codebase.
- New changes go through the graph workflow. Old code coexists untouched.
- Drift detection tells you when someone changed code outside the graph.

### For New Projects

- Start from an empty graph. Define nodes conversationally or manually.
- Materialize code module by module, iterating on the graph until quality is right.
- The graph _is_ your living architecture documentation.

### For Organizations

- Independent areas of the graph can have independent supervisors.
- Horizontal scaling: more modules does not mean more chaos.
- The graph is versioned with git — branchable, diffable, auditable.

---

## Strategic Goal

Build a tool where:

1. **Quality of generated code is a function of quality of the graph** — not the skill of the programmer or the size of the codebase.
2. **The context problem is solved structurally** — not by bigger models or longer context windows, but by giving each agent exactly the context it needs.
3. **Adoption is incremental** — works with any project, any tech stack, any repo structure, from day one.
4. **The graph is the single source of truth** — code is its expression, nothing more.
