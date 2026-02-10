import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export async function hashFile(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  return 'sha256:' + createHash('sha256').update(content).digest('hex');
}

export function hashString(content: string): string {
  return 'sha256:' + createHash('sha256').update(content).digest('hex');
}
