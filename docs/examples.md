# Examples

Hands-on examples that demonstrate Yggdrasil concepts and workflows. Each example is self-contained and can be run locally.

**→ [Playing with Examples](/examples-playing)** — How to start, run `/ygg.materialize`, and add features (e.g. categories + order notification bell).

| Example | Description | Key Concepts |
|---------|-------------|--------------|
| [Hello World](/examples/hello-world) | Minimal graph: nodes, relations, tags, aspects | Hierarchy, relational context, aspect injection, materialization |
| [Coffee Shop](/examples/coffee-shop) | Blog & store: landing, products, CMS, checkout | Modules, flows, multi-file mapping, audit aspect |

## Try an Example

1. Open an example in your IDE.
2. Tell your agent: *"Work in this directory. Run /ygg.materialize."*
3. The agent generates code from the graph.
4. Run the app (`npm run dev` or `npm test`).
5. Add features by editing the graph and running `/ygg.materialize` again.

See [Playing with Examples](/examples-playing) for the full workflow and a concrete example (categories + order notification bell).

## What Examples Demonstrate

- **Graph structure** — How nodes, modules, and artifacts are organized
- **CLI commands** — `ygg tree`, `ygg check`, `ygg build-context`, `ygg resolve-deps`, `ygg drift`
- **Agent workflow** — `/ygg.materialize` reading context and producing code
- **Separation of concerns** — Graph (spec) vs. generated code; `.gitignore` keeps examples clean
