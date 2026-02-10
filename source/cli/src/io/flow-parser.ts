import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import path from 'node:path';
import type { FlowDef } from '../model/types.js';
import { readArtifacts } from './artifact-reader.js';

export async function parseFlow(flowDirPath: string, yggRoot: string): Promise<FlowDef> {
  const flowYamlPath = path.join(flowDirPath, 'flow.yaml');
  const content = await readFile(flowYamlPath, 'utf-8');
  const raw = parseYaml(content) as Record<string, unknown>;

  if (!raw.name || !raw.nodes) {
    throw new Error(`flow.yaml at ${flowDirPath}: missing 'name' or 'nodes'`);
  }

  // Read all artifact files in the flow directory (everything except flow.yaml)
  const artifacts = await readArtifacts(flowDirPath, ['flow.yaml']);

  // dirPath: relative to .yggdrasil/
  const dirPath = path.relative(yggRoot, flowDirPath).split(path.sep).join('/');

  return {
    name: raw.name as string,
    nodes: raw.nodes as string[],
    artifacts,
    dirPath,
  };
}
