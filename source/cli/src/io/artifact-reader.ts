import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import type { Artifact } from '../model/types.js';

/** File extensions considered binary (skip these) */
const BINARY_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.svg',
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
]);

export async function readArtifacts(
  dirPath: string,
  excludeFiles: string[] = ['node.yaml'],
): Promise<Artifact[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const artifacts: Artifact[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (excludeFiles.includes(entry.name)) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (BINARY_EXTENSIONS.has(ext)) continue;

    const filePath = path.join(dirPath, entry.name);
    const content = await readFile(filePath, 'utf-8');
    artifacts.push({ filename: entry.name, content });
  }

  // Sort by filename for deterministic output
  artifacts.sort((a, b) => a.filename.localeCompare(b.filename));
  return artifacts;
}
