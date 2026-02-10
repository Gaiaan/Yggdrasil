# FAQ

## Do I need to describe my entire codebase?

No. The graph can cover one module, one feature, or the whole system. Code outside the graph coexists untouched. Start small and expand at your pace. See [Adoption Guide](/adoption-guide).

## Can I use Yggdrasil with [agent]?

Yggdrasil works with any agent that can read markdown and run shell commands. Built-in support: Claude Code, Cursor, GitHub Copilot, Gemini CLI. To add another agent, create an adapter (see [AGENTS.md](https://github.com/gaiaan/yggdrasil/blob/main/AGENTS.md)).

## What happens when someone edits generated code?

**Drift** — the graph and code disagree. Run `ygg drift` to detect it. You then **absorb** (update the graph to match the code) or **reject** (rematerialize from the graph). Drift is not a sin; unresolved drift is. See [Core Concepts](/concepts#drift).

## How is this different from [tool]?

Yggdrasil introduces a **formal graph layer** between intent and code. AI agents receive **precise context packages** instead of searching the codebase. The graph is the single source of truth; code is derived. Most tools either operate directly on code (context degrades with size) or use flat specs (no architecture model). Yggdrasil combines structured graph + precise context + any agent.

## Is the graph a database?

No. The graph is **files** — directories, YAML, markdown. Git handles versioning. No custom storage, no graph database. A changeset is a git diff on `yggdrasil/`.

## Do I need API keys for the CLI?

No. The `ygg` CLI is purely mechanical — it reads files, builds context, resolves dependencies. No AI, no API keys, no network. Your agent (Cursor, Claude, etc.) has the keys; the CLI feeds it the right context.

## How do I add a new agent?

1. Create an adapter in `source/cli/src/templates/adapters/<agent-name>.ts`
2. Read canonical commands from `templates/commands/*.md`
3. Convert to the agent's format
4. Register in `init.ts`
5. Submit a PR

See [AGENTS.md](https://github.com/gaiaan/yggdrasil/blob/main/AGENTS.md) for details.

## Can I materialize without an AI agent?

The context package is plain markdown. You could hand it to a human developer. But the workflow is designed for AI — the agent reads the package and generates code. For full automation, you need an agent.

## What if my node produces multiple files?

Use a list in `mapping.path`:

```yaml
mapping:
  path:
    - app/shop/page.tsx
    - app/shop/loading.tsx
    - src/features/shop/ProductListingPage.tsx
```

Aspects can provide materialization guidance (e.g., a `page` aspect for Next.js conventions). See [Building a Graph](/graph-guide#multi-file-mapping).
