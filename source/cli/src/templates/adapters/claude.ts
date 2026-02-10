import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function installClaude(templatesDir: string, projectRoot: string): Promise<void> {
  const targetDir = path.join(projectRoot, '.claude', 'commands');
  await mkdir(targetDir, { recursive: true });
  await copyMarkdownCommands(templatesDir, targetDir);
}

async function copyMarkdownCommands(src: string, dest: string): Promise<void> {
  const files = await readdir(src);
  for (const file of files) {
    if (!file.startsWith('ygg-') || !file.endsWith('.md')) continue;
    let content = await readFile(path.join(src, file), 'utf-8');
    content = addClaudeName(content, file);
    await writeFile(path.join(dest, file), content);
  }
}

/**
 * Adds `name` to frontmatter for Claude Code skills.
 * name becomes /slash-command (Claude allows lowercase, numbers, hyphens only)
 */
function addClaudeName(content: string, filename: string): string {
  const name = filename.replace(/^ygg-(.+)\.md$/, 'ygg-$1');
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!frontmatterMatch || frontmatterMatch[1].includes('name:')) return content;

  const frontmatter = frontmatterMatch[1];
  const newFrontmatter = frontmatter.trimEnd() + `\nname: ${name}\n`;
  return content.replace(frontmatterMatch[0], '---\n' + newFrontmatter + '---\n');
}
