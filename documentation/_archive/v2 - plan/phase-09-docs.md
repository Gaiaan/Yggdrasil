# Phase 09 — Documentation Site (VitePress)

## Goal

Create a user-facing documentation site using VitePress. Content derived from the v2 specification but reformatted for end users (shorter, with examples, navigation).

## Prerequisites

- Phase 07 complete (CLI commands exist and can be referenced)

## Spec References

- All content sources: `documentation/v2/` (reformat, don't copy verbatim)

---

## Step 1: Initialize VitePress in `docs/`

Create `docs/package.json`:

```json
{
  "private": true,
  "scripts": {
    "dev": "vitepress dev",
    "build": "vitepress build",
    "preview": "vitepress preview"
  },
  "devDependencies": {
    "vitepress": "^1.5.0"
  }
}
```

Create `docs/.vitepress/config.ts`:

```typescript
import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Yggdrasil',
  description: 'Graph-Driven Software Development',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'CLI Reference', link: '/cli-reference' },
      { text: 'GitHub', link: 'https://github.com/gaiaan/yggdrasil' },
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is Yggdrasil?', link: '/' },
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Installation', link: '/installation' },
        ],
      },
      {
        text: 'Concepts',
        items: [
          { text: 'Core Concepts', link: '/concepts' },
          { text: 'Building a Graph', link: '/graph-guide' },
          { text: 'Workflow', link: '/workflow' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'CLI Commands', link: '/cli-reference' },
          { text: 'Agent Commands', link: '/agent-commands' },
        ],
      },
      {
        text: 'Adoption',
        items: [
          { text: 'Adoption Guide', link: '/adoption-guide' },
          { text: 'FAQ', link: '/faq' },
        ],
      },
    ],
  },
});
```

---

## Step 2: Create documentation pages

### `docs/index.md` — Landing page

VitePress hero layout with:
- Tagline: "Graph-Driven Software Development"
- Description: one paragraph about what Yggdrasil does
- Quick action buttons: "Get Started", "CLI Reference"
- Feature cards: "Precise Context", "Graph as Truth", "Any AI Agent", "Incremental Adoption"

### `docs/getting-started.md` — Quick start (5 minutes)

Step by step:
1. Install: `npm install -g @gaiaan/yggdrasil-cli`
2. Init: `ygg init --agent cursor`
3. Configure: edit config.yaml
4. Create first node: mkdir + node.yaml + description.md
5. Build context: `ygg build-context my-node`
6. Check graph: `ygg check`

### `docs/installation.md` — Detailed installation

- Prerequisites (Node 22+)
- Global install
- `ygg init` with all agent options
- Verify installation

### `docs/concepts.md` — Core concepts

Derived from `02-core-concepts.md`. Key sections:
- The Two Worlds (Graph vs Code)
- Node, Artifact, Tag, Aspect, Flow, Relation
- Context Package
- Materialization
- Drift

### `docs/graph-guide.md` — How to build a graph

Derived from `03-graph-structure.md`. Practical guide:
- Directory structure
- Writing node.yaml
- Writing artifacts
- config.yaml setup
- Defining tags and aspects
- Creating flows

### `docs/workflow.md` — The pipeline

Derived from `05-workflow.md`:
- brief -> clarify -> plan -> check -> apply -> materialize -> drift
- When to skip stages
- Examples for each stage

### `docs/cli-reference.md` — CLI reference

Table format derived from `06-cli-reference.md`:
- Each command with usage, options, output, exit codes
- Examples

### `docs/agent-commands.md` — Agent command reference

From `07-agent-commands.md`:
- Table of all 9 commands
- Brief description of each
- How they use CLI tools
- Which agents are supported

### `docs/adoption-guide.md` — Adoption

From `10-adoption.md`:
- Greenfield path
- Brownfield: new features only
- Brownfield: ingest existing code
- Brownfield: progressive replacement
- CI/CD integration

### `docs/faq.md` — FAQ

Common questions:
- "Do I need to describe my entire codebase?"
- "Can I use Yggdrasil with [agent]?"
- "What happens when someone edits generated code?"
- "How is this different from [tool]?"
- "Is the graph a database?"

---

## Step 3: Build and verify

```bash
cd docs
npm install
npm run dev    # local preview at http://localhost:5173
npm run build  # production build to .vitepress/dist/
```

---

## Acceptance Criteria

- [ ] `docs/` directory exists with VitePress configuration
- [ ] All 10 documentation pages exist with content
- [ ] Navigation sidebar works correctly
- [ ] `npm run build` in docs/ produces static site
- [ ] Site renders correctly in browser (check with `npm run dev`)
- [ ] Content is user-facing (not copy of spec — shorter, with examples)
