import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function installGemini(templatesDir: string, projectRoot: string): Promise<void> {
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
  const frontmatterMatch = mdContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  let body: string;
  let description = '';

  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const descMatch = frontmatter.match(/^description:\s*["']([^"']*)["']/m);
    if (descMatch) description = descMatch[1];
    body = mdContent.slice(frontmatterMatch[0].length);
  } else {
    body = mdContent;
  }

  body = body.replace(/\$ARGUMENTS/g, '{{args}}').trim();

  // TOML multi-line basic string """ requires escaping \ and "
  const escapedBody = body.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `description = """${description}"""

prompt = """
${escapedBody}
"""
`;
}
