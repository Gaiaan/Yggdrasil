import { readFile, writeFile } from 'node:fs/promises';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import path from 'node:path';
import type { DriftState, DriftStateEntry } from '../model/types.js';

const DRIFT_STATE_FILE = '.drift-state';

export async function readDriftState(yggRoot: string): Promise<DriftState> {
  const filePath = path.join(yggRoot, DRIFT_STATE_FILE);
  try {
    const content = await readFile(filePath, 'utf-8');
    const raw = parseYaml(content) as {
      entries?: Record<string, DriftStateEntry>;
    };
    return { entries: raw.entries ?? {} };
  } catch {
    // File doesn't exist yet — empty state
    return { entries: {} };
  }
}

export async function writeDriftState(yggRoot: string, state: DriftState): Promise<void> {
  const filePath = path.join(yggRoot, DRIFT_STATE_FILE);
  const header = '# .yggdrasil/.drift-state (auto-generated, do not edit manually)\n';
  const content = header + stringifyYaml({ entries: state.entries });
  await writeFile(filePath, content, 'utf-8');
}
