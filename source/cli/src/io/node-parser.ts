import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import type { NodeMeta } from '../model/types.js';

export async function parseNodeYaml(filePath: string): Promise<NodeMeta> {
  const content = await readFile(filePath, 'utf-8');
  const raw = parseYaml(content) as Record<string, unknown>;

  if (!raw.name || typeof raw.name !== 'string') {
    throw new Error(`node.yaml at ${filePath}: missing 'name'`);
  }
  if (!raw.type || typeof raw.type !== 'string') {
    throw new Error(`node.yaml at ${filePath}: missing 'type'`);
  }

  // Normalize mapping.path to always be string | string[]
  const mapping = raw.mapping as { path?: string | string[] } | undefined;

  return {
    name: raw.name as string,
    type: raw.type as string,
    tags: (raw.tags as string[]) ?? undefined,
    relations: (raw.relations as NodeMeta['relations']) ?? undefined,
    mapping: mapping ? { path: mapping.path ?? '' } : undefined,
    blackbox: (raw.blackbox as boolean) ?? false,
  };
}
