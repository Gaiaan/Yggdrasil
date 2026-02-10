import { describe, it, expect } from 'vitest';
import { readdir, readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installClaude } from '../../../src/templates/adapters/claude.js';
import { installCursor } from '../../../src/templates/adapters/cursor.js';
import { installCopilot } from '../../../src/templates/adapters/copilot.js';
import { installGemini } from '../../../src/templates/adapters/gemini.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMMANDS_DIR = path.join(__dirname, '../../../src/templates/commands');

describe('adapters', () => {
  const tmpRoot = path.join(__dirname, '../../fixtures/tmp-adapters');

  beforeEach(async () => {
    await mkdir(tmpRoot, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpRoot, { recursive: true, force: true });
  });

  it('Claude adapter copies all 9 files with name in frontmatter', async () => {
    await installClaude(COMMANDS_DIR, tmpRoot);

    const targetDir = path.join(tmpRoot, '.claude', 'commands');
    const files = await readdir(targetDir);
    const mdFiles = files.filter((f) => f.startsWith('ygg-') && f.endsWith('.md'));

    expect(mdFiles).toHaveLength(9);
    const content = await readFile(path.join(targetDir, 'ygg-brief.md'), 'utf-8');
    expect(content).toContain('name: ygg-brief');
    expect(content).toContain('# /ygg.brief');
    expect(content).toContain('description:');
  });

  it('Cursor adapter copies all 9 files to .cursor/commands/', async () => {
    await installCursor(COMMANDS_DIR, tmpRoot);

    const targetDir = path.join(tmpRoot, '.cursor', 'commands');
    const files = await readdir(targetDir);
    const mdFiles = files.filter((f) => f.startsWith('ygg-') && f.endsWith('.md'));

    expect(mdFiles).toHaveLength(9);
    const content = await readFile(path.join(targetDir, 'ygg-materialize.md'), 'utf-8');
    expect(content).toContain('# /ygg.materialize');
  });

  it('Copilot adapter outputs .agent.md files with name, tools, and handoffs as agent refs', async () => {
    await installCopilot(COMMANDS_DIR, tmpRoot);

    const targetDir = path.join(tmpRoot, '.github', 'agents');
    const files = await readdir(targetDir);
    const agentFiles = files.filter((f) => f.startsWith('ygg-') && f.endsWith('.agent.md'));
    expect(agentFiles).toHaveLength(9);

    const content = await readFile(path.join(targetDir, 'ygg-brief.agent.md'), 'utf-8');
    expect(content).toContain('name: "/ygg.brief"');
    expect(content).toContain('agent: ygg-clarify');
    expect(content).toContain('agent: ygg-plan');
    expect(content).toContain('tools: ["read", "search", "edit", "execute"]');
    expect(content).not.toContain('cli_tools');
    expect(content).toContain('# /ygg.brief');
  });

  it('Gemini adapter converts md to valid TOML with {{args}} placeholder', async () => {
    await installGemini(COMMANDS_DIR, tmpRoot);

    const targetDir = path.join(tmpRoot, '.gemini', 'commands');
    const files = await readdir(targetDir);
    const tomlFiles = files.filter((f) => f.startsWith('ygg-') && f.endsWith('.toml'));

    expect(tomlFiles).toHaveLength(9);

    const content = await readFile(path.join(targetDir, 'ygg-brief.toml'), 'utf-8');
    expect(content).toContain('description = ');
    expect(content).toContain('prompt = ');
    expect(content).toContain('/ygg.brief');
    // Ensure $ARGUMENTS would be replaced if present
    expect(content).not.toContain('$ARGUMENTS');
  });

  it('Gemini adapter replaces $ARGUMENTS with {{args}}', async () => {
    const testDir = path.join(tmpRoot, 'gemini-args');
    await mkdir(testDir, { recursive: true });
    await writeFile(
      path.join(testDir, 'ygg-test.md'),
      `---
description: "Test"
handoffs: []
cli_tools: []
---

# Test
Use $ARGUMENTS here.
`,
      'utf-8',
    );

    await installGemini(testDir, tmpRoot);

    const content = await readFile(
      path.join(tmpRoot, '.gemini', 'commands', 'ygg-test.toml'),
      'utf-8',
    );
    expect(content).toContain('{{args}}');
    expect(content).not.toContain('$ARGUMENTS');
  });
});
