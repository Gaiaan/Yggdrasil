import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import type { AspectDef } from '../model/types.js';

export async function parseAspect(filePath: string): Promise<AspectDef> {
  const content = await readFile(filePath, 'utf-8');
  const raw = parseYaml(content) as Record<string, unknown>;

  if (!raw.name || !raw.tag) {
    throw new Error(`Aspect file ${filePath}: missing 'name' or 'tag'`);
  }

  return {
    name: raw.name as string,
    tag: raw.tag as string,
    description: (raw.description as string) ?? '',
    requirements: (raw.requirements as string[]) ?? undefined,
    rawContent: content,
  };
}
