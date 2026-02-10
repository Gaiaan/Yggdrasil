import { describe, it, expect } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMMANDS_DIR = path.join(__dirname, '../../../src/templates/commands');

const REQUIRED_SECTIONS = ['Workflow', 'Rules'] as const;

describe('command files', () => {
  it('each command file has valid YAML frontmatter with description, handoffs, cli_tools', async () => {
    const files = await readdir(COMMANDS_DIR);
    const commandFiles = files.filter((f) => f.startsWith('ygg-') && f.endsWith('.md'));

    expect(commandFiles).toHaveLength(9);

    for (const file of commandFiles) {
      const content = await readFile(path.join(COMMANDS_DIR, file), 'utf-8');
      const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
      expect(match, `${file} should have frontmatter`).toBeTruthy();

      const frontmatter = parseYaml(match![1]);
      expect(typeof frontmatter.description, `${file} should have description`).toBe('string');
      expect(frontmatter.description.length).toBeGreaterThan(0);
      expect(frontmatter.handoffs, `${file} should have handoffs`).toBeDefined();
      expect(Array.isArray(frontmatter.handoffs)).toBe(true);
      expect(frontmatter.cli_tools, `${file} should have cli_tools`).toBeDefined();
      expect(Array.isArray(frontmatter.cli_tools)).toBe(true);
    }
  });

  it('all command files contain required sections: Workflow, Rules', async () => {
    const files = await readdir(COMMANDS_DIR);
    const commandFiles = files.filter((f) => f.startsWith('ygg-') && f.endsWith('.md'));

    for (const file of commandFiles) {
      const content = await readFile(path.join(COMMANDS_DIR, file), 'utf-8');
      const body = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');

      for (const section of REQUIRED_SECTIONS) {
        expect(body.includes(`## ${section}`), `${file} should contain ## ${section}`).toBe(true);
      }
    }
  });
});
