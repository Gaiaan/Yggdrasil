import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function installCopilot(templatesDir: string, projectRoot: string): Promise<void> {
  const targetDir = path.join(projectRoot, '.github', 'agents');
  await mkdir(targetDir, { recursive: true });
  await copyAndTransformForCopilot(templatesDir, targetDir);
}

async function copyAndTransformForCopilot(src: string, dest: string): Promise<void> {
  const files = await readdir(src);
  for (const file of files) {
    if (!file.startsWith('ygg-') || !file.endsWith('.md')) continue;
    let content = await readFile(path.join(src, file), 'utf-8');
    content = transformForCopilotAgent(content, file);
    const agentFile = file.replace('.md', '.agent.md');
    await writeFile(path.join(dest, agentFile), content);
  }
}

/**
 * Transforms canonical command format to GitHub Copilot Custom Agent format.
 * - Adds .agent.md extension (output handled by caller)
 * - Adds `name` field (required for display in agents dropdown)
 * - Converts handoffs: command → agent (Copilot uses agent names, not slash commands)
 * - Removes cli_tools (Copilot-specific)
 * - Adds tools for agent capabilities
 */
function transformForCopilotAgent(content: string, filename: string): string {
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!frontmatterMatch) return content;

  const frontmatter = frontmatterMatch[1];
  const agentName = filename.replace(/^ygg-(.+)\.md$/, 'ygg.$1');

  // Extract description
  const descMatch = frontmatter.match(/^description:\s*["']([^"']*)["']/m);
  const description = descMatch ? descMatch[1] : `Yggdrasil: ${agentName}`;

  // Transform handoffs: command: /ygg.xyz → agent: ygg-xyz (Copilot uses agent names)
  let newFrontmatter = frontmatter
    .replace(/command:\s*\/ygg\.(\w+)/g, 'agent: ygg-$1')
    .replace(/\n?cli_tools:\s*(?:\[\s*\])?(?:\n\s+-\s+[^\n]+)*\n?/g, '');

  // Add name (required for display in agents dropdown)
  if (!newFrontmatter.includes('name:')) {
    newFrontmatter = `name: "/${agentName}"\n${newFrontmatter}`;
  }

  // Add tools for Yggdrasil workflow (read, search, edit, execute for ygg CLI)
  if (!newFrontmatter.includes('tools:')) {
    newFrontmatter = newFrontmatter.trimEnd() + '\ntools: ["read", "search", "edit", "execute"]\n';
  }

  return content.replace(frontmatterMatch[0], `---\n${newFrontmatter.trim()}\n---\n`);
}
