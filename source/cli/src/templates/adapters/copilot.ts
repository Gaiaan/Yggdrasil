import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function installCopilot(templatesDir: string, projectRoot: string): Promise<void> {
  const targetDir = path.join(projectRoot, '.github', 'agents');
  await mkdir(targetDir, { recursive: true });
  await copyMarkdownCommandsWithMode(templatesDir, targetDir);
}

async function copyMarkdownCommandsWithMode(src: string, dest: string): Promise<void> {
  const files = await readdir(src);
  for (const file of files) {
    if (!file.startsWith('ygg-') || !file.endsWith('.md')) continue;
    let content = await readFile(path.join(src, file), 'utf-8');
    content = addCopilotMode(content, file);
    await writeFile(path.join(dest, file), content);
  }
}

/**
 * Adds `mode: ygg.<command-name>` to frontmatter for Copilot.
 * Command name derived from filename: ygg-brief.md -> ygg.brief
 */
function addCopilotMode(content: string, filename: string): string {
  const commandName = filename.replace(/^ygg-(.+)\.md$/, 'ygg.$1');
  const modeLine = `mode: "${commandName}"`;

  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!frontmatterMatch) return content;

  const frontmatter = frontmatterMatch[1];
  if (frontmatter.includes('mode:')) return content;

  const newFrontmatter = frontmatter.trimEnd() + '\n' + modeLine + '\n';
  return content.replace(frontmatterMatch[0], '---\n' + newFrontmatter + '---\n');
}
