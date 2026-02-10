# Repo consistency after adapter & discipline changes

## Context

We made several changes in one session:

1. **Copilot adapter** — outputs `.agent.md`, adds `name`/`tools`, converts handoffs `command:`→`agent:`
2. **Claude adapter** — adds `name` field
3. **Gemini adapter** — `prompt = """..."""` instead of `[prompt] text = """..."""`
4. **Workflow discipline** — brief → plan → apply, never skip
5. **Graph as source of truth** — complete knowledge in graph, no placeholders

Code, tests, prompts, and main docs are already updated. But secondary docs, the FAQ, and the graph-guide may still have stale or incomplete information.

## Requirements

- **docs/faq.md line 21**: references old `yggdrasil/` directory name (should be `.yggdrasil/`)
- **docs/graph-guide.md line 155-157**: says "the more precise the artifacts, the better" — this is a soft suggestion. It should state the principle clearly: artifacts must be complete, not optional-nice-to-have. Align with "graph holds complete knowledge" from concepts.md.
- **docs/spec/materialization.md**: does not mention that graph must hold complete knowledge. It describes the materialization loop but doesn't explicitly state the input must be complete, not vague.
- **docs/adoption-guide.md**: does not mention workflow discipline (brief → plan → apply). A new user following this guide would not learn about the pipeline.
- **docs/cli-reference.md**: mentions output directories for each agent but doesn't note that Claude adds `name` or that Copilot outputs `.agent.md` with `name`/`tools`/`agent:` handoffs — only the path was fixed.
- **Gemini TOML test**: the existing test (`adapters.test.ts`) checks for `prompt =` but the old `[prompt]` test was removed — verify no regression.
- **Stale `.github/agents/` in source/cli/**: the build command left test artifacts — check if `.github/agents/` inside `source/cli/` should be in `.gitignore`.

## Acceptance Criteria

- `docs/faq.md` references `.yggdrasil/` not `yggdrasil/`
- `docs/graph-guide.md` artifact section states completeness principle
- `docs/spec/materialization.md` states that graph input must be complete
- `docs/adoption-guide.md` mentions workflow discipline
- `docs/cli-reference.md` describes adapter output format differences
- No stale test artifacts committed to git
- `npx markdownlint-cli2` passes
- `npm test` in source/cli passes
