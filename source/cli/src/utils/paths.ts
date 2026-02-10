import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { access } from 'node:fs/promises';

/**
 * Directory containing the CLI package (dist/ when bundled).
 * Uses import.meta.url so it works when installed globally.
 */
export function getPackageRoot(): string {
  return path.dirname(fileURLToPath(import.meta.url));
}

/**
 * Find the .yggdrasil/ directory starting from projectRoot.
 * Returns the absolute path to the .yggdrasil/ directory.
 */
export async function findYggRoot(projectRoot: string): Promise<string> {
  const yggPath = path.join(projectRoot, '.yggdrasil');
  try {
    await access(yggPath);
    return yggPath;
  } catch {
    throw new Error(`No .yggdrasil/ directory found in ${projectRoot}. Run 'ygg init' first.`);
  }
}

/**
 * Normalize a mapping path to always return an array of strings.
 */
export function normalizeMappingPaths(mapping: { path: string | string[] } | undefined): string[] {
  if (!mapping) return [];
  return Array.isArray(mapping.path) ? mapping.path : [mapping.path];
}

/**
 * Convert a node's directory path to its graph path.
 * E.g., "/abs/path/.yggdrasil/orders/order-service" → "orders/order-service"
 */
export function toGraphPath(absolutePath: string, yggRoot: string): string {
  return path.relative(yggRoot, absolutePath).split(path.sep).join('/');
}
