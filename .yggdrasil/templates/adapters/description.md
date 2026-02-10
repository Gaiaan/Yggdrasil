# Agent Adapters

Convert canonical markdown command templates to agent-specific formats and install them to the agent's command directory.

## Adapters

| Adapter | Target Directory | Conversion |
|---------|-----------------|------------|
| claude.ts | `.claude/commands/` | Direct copy (markdown native) |
| cursor.ts | `.cursor/commands/` | Direct copy (markdown native) |
| copilot.ts | `.github/agents/` | Adds `mode: "ygg.<command>"` to frontmatter |
| gemini.ts | `.gemini/commands/` | Full md→TOML conversion, `$ARGUMENTS` → `{{args}}` |

## Interface

Each adapter exports an install function:

- `installClaude(projectRoot: string, templatesDir: string): Promise<void>`
- `installCursor(projectRoot: string, templatesDir: string): Promise<void>`
- `installCopilot(projectRoot: string, templatesDir: string): Promise<void>`
- `installGemini(projectRoot: string, templatesDir: string): Promise<void>`

## Gemini Conversion Details

- Extracts `description` from YAML frontmatter
- Removes frontmatter, converts body to TOML multi-line string
- Escapes backslashes and quotes for TOML compatibility
- `handoffs` and `cli_tools` frontmatter fields are NOT preserved in TOML output
