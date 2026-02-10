# Phase 08 — Agent Command Prompts

## Goal

Create the 9 canonical agent command files (full prompt content in markdown) and the 4 agent adapters (claude, cursor, copilot, gemini). Wire template copying into `ygg init`.

## Prerequisites

- Phase 07 complete (init command scaffolding exists)

## Spec References

- Full command content: `documentation/v2/07-agent-commands.md` (entire document)
- Agent directories: `documentation/v2/07-agent-commands.md` lines 15-23
- Each command specification: lines 58-534

---

## Step 1: Create canonical command files

Create 9 files in `source/cli/src/templates/commands/`. Each file is the actual prompt that the AI agent will read and follow. Use the EXACT content from `documentation/v2/07-agent-commands.md` for each command.

The frontmatter must include `description`, `handoffs`, and `cli_tools` fields.

### Files to create:

| File | Spec location in 07-agent-commands.md |
|------|--------------------------------------|
| `ygg-brief.md` | Lines 62-106 |
| `ygg-clarify.md` | Lines 114-154 |
| `ygg-plan.md` | Lines 160-225 |
| `ygg-apply.md` | Lines 231-275 |
| `ygg-check.md` | Lines 281-299 |
| `ygg-materialize.md` | Lines 305-366 |
| `ygg-drift.md` | Lines 372-399 |
| `ygg-define.md` | Lines 405-439 |
| `ygg-ingest.md` | Lines 445-520 |

### Template for each file

Use this structure (adapt per command from the spec content):

```markdown
---
description: "<one-line description from spec>"
handoffs:
  - command: /ygg.<next>
    label: "<label>"
    prompt: "<what to say>"
cli_tools:
  - ygg <tool1>
  - ygg <tool2>
---

<Full command content from 07-agent-commands.md>
```

### Specific content per command

**ygg-brief.md** — Copy the `/ygg.brief` section verbatim from the spec. Add frontmatter:
```yaml
description: "Gather requirements and create a brief for graph changes"
handoffs:
  - command: /ygg.clarify
    label: "Clarify the brief"
    prompt: "Run /ygg.clarify to resolve ambiguities in this brief."
  - command: /ygg.plan
    label: "Plan graph changes"
    prompt: "Run /ygg.plan to propose graph changes based on this brief."
cli_tools: []
```

**ygg-clarify.md** — Frontmatter:
```yaml
description: "Analyze a brief and ask clarifying questions"
handoffs:
  - command: /ygg.plan
    label: "Plan graph changes"
    prompt: "Run /ygg.plan to propose graph changes."
cli_tools: []
```

**ygg-plan.md** — Frontmatter:
```yaml
description: "Propose graph changes based on a brief"
handoffs:
  - command: /ygg.apply
    label: "Apply changes"
    prompt: "Run /ygg.apply to create the graph files."
cli_tools:
  - ygg tree
  - ygg build-context
  - ygg affected
```

**ygg-apply.md** — Frontmatter:
```yaml
description: "Apply graph changes from a plan or instructions"
handoffs:
  - command: /ygg.materialize
    label: "Materialize code"
    prompt: "Run /ygg.materialize to generate code from the graph."
cli_tools:
  - ygg check
```

**ygg-check.md** — Frontmatter:
```yaml
description: "Validate graph consistency"
handoffs:
  - command: /ygg.apply
    label: "Fix issues"
    prompt: "Fix the issues found by ygg check."
cli_tools:
  - ygg check
```

**ygg-materialize.md** — Frontmatter:
```yaml
description: "Materialize graph nodes into source code"
handoffs:
  - command: /ygg.drift
    label: "Check for drift"
    prompt: "Run /ygg.drift to verify code matches graph."
cli_tools:
  - ygg resolve-deps
  - ygg build-context
```

**ygg-drift.md** — Frontmatter:
```yaml
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
```

**ygg-define.md** — Frontmatter:
```yaml
description: "Define or edit a graph node conversationally"
handoffs:
  - command: /ygg.materialize
    label: "Materialize"
    prompt: "Run /ygg.materialize to generate code for this node."
cli_tools:
  - ygg check
```

**ygg-ingest.md** — Frontmatter:
```yaml
description: "Ingest existing code into the graph as blackbox nodes"
handoffs:
  - command: /ygg.plan
    label: "Plan changes"
    prompt: "Run /ygg.plan to plan changes using the ingested graph."
cli_tools:
  - ygg check
```

---

## Step 2: Create adapters

### `src/templates/adapters/claude.ts`

Simply copies .md files to `.claude/commands/` with no transformation (Claude uses the same markdown format).

```typescript
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

export async function installClaude(
  templatesDir: string,
  projectRoot: string,
): Promise<void> {
  const targetDir = path.join(projectRoot, '.claude', 'commands');
  await mkdir(targetDir, { recursive: true });
  await copyMarkdownCommands(templatesDir, targetDir);
}

async function copyMarkdownCommands(src: string, dest: string): Promise<void> {
  const files = await readdir(src);
  for (const file of files) {
    if (!file.startsWith('ygg-') || !file.endsWith('.md')) continue;
    const content = await readFile(path.join(src, file), 'utf-8');
    await writeFile(path.join(dest, file), content);
  }
}
```

### `src/templates/adapters/cursor.ts`

Same as Claude — copies .md to `.cursor/commands/`.

### `src/templates/adapters/copilot.ts`

Copies .md to `.github/agents/`. Adds `mode: ygg.<command-name>` to frontmatter if needed by Copilot.

### `src/templates/adapters/gemini.ts`

Converts markdown to TOML format. This is the only non-trivial adapter:

```typescript
export async function installGemini(
  templatesDir: string,
  projectRoot: string,
): Promise<void> {
  const targetDir = path.join(projectRoot, '.gemini', 'commands');
  await mkdir(targetDir, { recursive: true });

  const files = await readdir(templatesDir);
  for (const file of files) {
    if (!file.startsWith('ygg-') || !file.endsWith('.md')) continue;
    const mdContent = await readFile(path.join(templatesDir, file), 'utf-8');
    const tomlContent = convertMdToToml(mdContent);
    const tomlFile = file.replace('.md', '.toml');
    await writeFile(path.join(targetDir, tomlFile), tomlContent);
  }
}

function convertMdToToml(mdContent: string): string {
  // 1. Extract frontmatter (between --- markers)
  // 2. Extract body (everything after second ---)
  // 3. Replace $ARGUMENTS with {{args}}
  // 4. Format as TOML:
  //    description = "..."
  //    [prompt]
  //    text = """
  //    <body content>
  //    """
  // Return TOML string
}
```

---

## Step 3: Wire adapters into `ygg init`

Update `src/cli/init.ts` to use the adapters:

```typescript
import { installClaude } from '../templates/adapters/claude.js';
import { installCursor } from '../templates/adapters/cursor.js';
import { installCopilot } from '../templates/adapters/copilot.js';
import { installGemini } from '../templates/adapters/gemini.js';

const INSTALLERS: Record<string, (templatesDir: string, projectRoot: string) => Promise<void>> = {
  claude: installClaude,
  cursor: installCursor,
  copilot: installCopilot,
  gemini: installGemini,
};

// In init action:
const installer = INSTALLERS[agentName];
const templatesDir = path.join(__dirname, 'templates', 'commands');
await installer(templatesDir, projectRoot);
```

---

## Step 4: Tests

1. Each command file parses correctly (valid YAML frontmatter + markdown body)
2. Claude adapter copies all 9 files to correct directory
3. Cursor adapter copies all 9 files
4. Copilot adapter copies files with correct format
5. Gemini adapter converts to valid TOML with {{args}} placeholder
6. `ygg init --agent cursor` creates 9 files in `.cursor/commands/`
7. All command files contain required sections: Context, Workflow, Rules

---

## Acceptance Criteria

- [ ] 9 canonical command files exist in `src/templates/commands/`
- [ ] Each file has valid frontmatter with description, handoffs, cli_tools
- [ ] Each file contains full workflow instructions from the spec
- [ ] 4 adapters exist (claude, cursor, copilot, gemini)
- [ ] Gemini adapter converts md to toml correctly
- [ ] `ygg init --agent <name>` copies/converts files to correct directory
- [ ] $ARGUMENTS placeholder present in all commands
- [ ] Handoff chain: brief -> clarify -> plan -> apply -> materialize -> drift
