import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import type { YggConfig } from '../model/types.js';

export async function parseConfig(filePath: string): Promise<YggConfig> {
  const content = await readFile(filePath, 'utf-8');
  const raw = parseYaml(content) as Record<string, unknown>;

  // Validate required fields
  if (!raw.name || typeof raw.name !== 'string') {
    throw new Error(`config.yaml: missing or invalid 'name' field`);
  }

  return {
    name: raw.name as string,
    stack: (raw.stack as Record<string, string>) ?? {},
    standards: (raw.standards as Record<string, string>) ?? {},
    limits: raw.limits as YggConfig['limits'],
    tags: (raw.tags as Record<string, YggConfig['tags'][string]>) ?? {},
  };
}
