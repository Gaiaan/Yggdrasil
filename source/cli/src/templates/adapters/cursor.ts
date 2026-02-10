import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function installCursor(templatesDir: string, projectRoot: string): Promise<void> {
  const targetDir = path.join(projectRoot, '.cursor', 'commands');
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
