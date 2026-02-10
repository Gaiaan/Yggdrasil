import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readdir, readFile, rm, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_ROOT = path.join(__dirname, '../..');
const BIN_PATH = path.join(CLI_ROOT, 'dist', 'bin.js');

describe('init --agent', () => {
  const tmpRoot = path.join(__dirname, '../fixtures/tmp-init-agent');

  beforeAll(async () => {
    await mkdir(tmpRoot, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpRoot, { recursive: true, force: true });
    await mkdir(tmpRoot, { recursive: true });
  });

  it('ygg init --agent cursor creates 9 files in .cursor/commands/', async () => {
    const result = spawnSync('node', [BIN_PATH, 'init', '--agent', 'cursor'], {
      cwd: tmpRoot,
      encoding: 'utf-8',
    });

    if (result.error) {
      if (result.error.message?.includes('ENOENT')) {
        return; // Skip if dist/bin.js not built
      }
      throw result.error;
    }

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Agent commands installed to .cursor/commands/');

    const commandsDir = path.join(tmpRoot, '.cursor', 'commands');
    const files = await readdir(commandsDir);
    const mdFiles = files.filter(
      (f) => f.startsWith('ygg-') && f.endsWith('.md'),
    );

    expect(mdFiles).toHaveLength(9);
    expect(mdFiles).toContain('ygg-brief.md');
    expect(mdFiles).toContain('ygg-materialize.md');
  });

  it('installed ygg-brief.md has correct content', async () => {
    const result = spawnSync('node', [BIN_PATH, 'init', '--agent', 'cursor'], {
      cwd: tmpRoot,
      encoding: 'utf-8',
    });

    if (result.error?.message?.includes('ENOENT')) return;

    expect(result.status).toBe(0);

    const content = await readFile(
      path.join(tmpRoot, '.cursor', 'commands', 'ygg-brief.md'),
      'utf-8',
    );

    expect(content).toContain('# /ygg.brief');
    expect(content).toContain('## Context');
    expect(content).toContain('## Workflow');
    expect(content).toContain('## Rules');
    expect(content).toContain('Gather requirements and create a brief');
    expect(content).toContain('.yggdrasil/.briefs/');
  });

  it('ygg init --agent cursor --commands-only updates commands without touching config', async () => {
    const { writeFile } = await import('node:fs/promises');
    const { mkdir } = await import('node:fs/promises');

    await mkdir(path.join(tmpRoot, '.yggdrasil'), { recursive: true });
    const customConfig = 'name: "My Custom Project"\nstack: {}\nstandards: {}\ntags: {}';
    await writeFile(path.join(tmpRoot, '.yggdrasil', 'config.yaml'), customConfig);

    const result = spawnSync('node', [BIN_PATH, 'init', '--agent', 'cursor', '--commands-only'], {
      cwd: tmpRoot,
      encoding: 'utf-8',
    });

    if (result.error?.message?.includes('ENOENT')) return;

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Agent commands updated');

    const configAfter = await readFile(path.join(tmpRoot, '.yggdrasil', 'config.yaml'), 'utf-8');
    expect(configAfter).toBe(customConfig);

    const files = await readdir(path.join(tmpRoot, '.cursor', 'commands'));
    expect(files.filter((f) => f.startsWith('ygg-'))).toHaveLength(9);
  });

  it('ygg init --commands-only without --agent exits with error', async () => {
    const result = spawnSync('node', [BIN_PATH, 'init', '--commands-only'], {
      cwd: tmpRoot,
      encoding: 'utf-8',
    });

    if (result.error?.message?.includes('ENOENT')) return;

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('--commands-only requires --agent');
  });
});
