import { readdir } from 'node:fs/promises';
import path from 'node:path';
import type { Graph, ValidationResult, ValidationIssue } from '../model/types.js';
import { buildContext } from './context-builder.js';
import { normalizeMappingPaths } from '../utils/paths.js';

/** Reserved directories that are NOT nodes */
const RESERVED_DIRS = new Set(['aspects', 'flows', '.briefs']);

export async function validate(graph: Graph): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];

  issues.push(...checkRelationTargets(graph));
  issues.push(...checkTagsDefined(graph));
  issues.push(...checkAspectTags(graph));
  issues.push(...checkNoCycles(graph));
  issues.push(...checkUniqueMappings(graph));
  issues.push(...(await checkDirectoriesHaveNodeYaml(graph)));
  issues.push(...checkFlowParticipants(graph));
  issues.push(...checkConflictingTags(graph));
  issues.push(...(await checkContextBudget(graph)));

  return { issues, nodesScanned: graph.nodes.size };
}

// --- Rule 1: Relation targets exist ---

function findSimilar(target: string, candidates: string[]): string | null {
  if (candidates.length === 0) return null;

  let best: string | null = null;
  let bestScore = -1;

  for (const c of candidates) {
    if (c === target) return c;
    // Simple similarity: shared path segments
    const targetParts = target.split('/');
    const candParts = c.split('/');
    let score = 0;
    for (let i = 0; i < Math.min(targetParts.length, candParts.length); i++) {
      if (targetParts[i] === candParts[i]) score++;
      else break;
    }
    if (score > bestScore && score > 0) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

function checkRelationTargets(graph: Graph): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const nodePaths = [...graph.nodes.keys()];
  for (const [nodePath, node] of graph.nodes) {
    for (const rel of node.meta.relations ?? []) {
      if (!graph.nodes.has(rel.target)) {
        const suggestion = findSimilar(rel.target, nodePaths);
        const hint = suggestion ? ` (did you mean '${suggestion}'?)` : '';
        issues.push({
          severity: 'error',
          rule: 'relation-targets-exist',
          message: `Relation target '${rel.target}' does not exist${hint}`,
          nodePath,
        });
      }
    }
  }
  return issues;
}

// --- Rule 2: Tags defined in config.yaml ---

function checkTagsDefined(graph: Graph): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const definedTags = new Set(Object.keys(graph.config.tags ?? {}));
  for (const [nodePath, node] of graph.nodes) {
    for (const tag of node.meta.tags ?? []) {
      if (!definedTags.has(tag)) {
        issues.push({
          severity: 'error',
          rule: 'tags-defined',
          message: `Tag '${tag}' not defined in config.yaml`,
          nodePath,
        });
      }
    }
  }
  return issues;
}

// --- Rule 3: Aspects reference valid tags ---

function checkAspectTags(graph: Graph): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const definedTags = new Set(Object.keys(graph.config.tags ?? {}));
  for (const aspect of graph.aspects) {
    if (!definedTags.has(aspect.tag)) {
      issues.push({
        severity: 'error',
        rule: 'aspect-tags-valid',
        message: `Aspect '${aspect.name}' references undefined tag '${aspect.tag}'`,
      });
    }
  }
  return issues;
}

// --- Rule 4: No circular dependencies ---

function checkNoCycles(graph: Graph): ValidationIssue[] {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();
  for (const p of graph.nodes.keys()) color.set(p, WHITE);

  const issues: ValidationIssue[] = [];

  function dfs(nodePath: string, pathSegments: string[]): boolean {
    color.set(nodePath, GRAY);
    const node = graph.nodes.get(nodePath)!;
    for (const rel of node.meta.relations ?? []) {
      if (!graph.nodes.has(rel.target)) continue;
      if (color.get(rel.target) === GRAY) {
        issues.push({
          severity: 'error',
          rule: 'no-cycles',
          message: `Circular dependency: ${[...pathSegments, nodePath, rel.target].join(' -> ')}`,
        });
        return true;
      }
      if (color.get(rel.target) === WHITE) {
        if (dfs(rel.target, [...pathSegments, nodePath])) return true;
      }
    }
    color.set(nodePath, BLACK);
    return false;
  }

  for (const nodePath of graph.nodes.keys()) {
    if (color.get(nodePath) === WHITE) {
      dfs(nodePath, []);
    }
  }

  return issues;
}

// --- Rule 5: Unique mapping paths ---

function checkUniqueMappings(graph: Graph): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Map<string, string>();

  for (const [nodePath, node] of graph.nodes) {
    const paths = normalizeMappingPaths(node.meta.mapping);
    for (const mp of paths) {
      if (mp === '') continue;
      if (seen.has(mp)) {
        issues.push({
          severity: 'error',
          rule: 'unique-mappings',
          message: `Mapping path '${mp}' is used by both '${seen.get(mp)}' and '${nodePath}'`,
          nodePath,
        });
      } else {
        seen.set(mp, nodePath);
      }
    }
  }
  return issues;
}

// --- Rule 6: Directories have node.yaml ---

async function checkDirectoriesHaveNodeYaml(graph: Graph): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const yggRoot = graph.rootPath;

  async function scanDir(dirPath: string, segments: string[]): Promise<void> {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const hasNodeYaml = entries.some((e) => e.isFile() && e.name === 'node.yaml');
    const dirName = path.basename(dirPath);

    if (RESERVED_DIRS.has(dirName)) return;

    const hasContent = entries.some((e) => e.isFile()) || entries.some((e) => e.isDirectory());
    const graphPath = segments.join('/');

    if (hasContent && !hasNodeYaml && graphPath !== '') {
      issues.push({
        severity: 'error',
        rule: 'directories-have-node-yaml',
        message: `Directory '${graphPath}' has content but no node.yaml`,
        nodePath: graphPath,
      });
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (RESERVED_DIRS.has(entry.name)) continue;
      if (entry.name.startsWith('.')) continue;
      await scanDir(path.join(dirPath, entry.name), [...segments, entry.name]);
    }
  }

  const rootEntries = await readdir(yggRoot, { withFileTypes: true });
  for (const entry of rootEntries) {
    if (!entry.isDirectory()) continue;
    if (RESERVED_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith('.')) continue;
    await scanDir(path.join(yggRoot, entry.name), [entry.name]);
  }

  return issues;
}

// --- Rule 7: Flow participants exist ---

function checkFlowParticipants(graph: Graph): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const flow of graph.flows) {
    for (const participant of flow.nodes) {
      if (!graph.nodes.has(participant)) {
        issues.push({
          severity: 'error',
          rule: 'flow-participants-exist',
          message: `Flow '${flow.name}' references non-existent node '${participant}'`,
        });
      }
    }
  }
  return issues;
}

// --- Rule 8: No conflicting tags ---

function deduplicateIssues(issues: ValidationIssue[]): ValidationIssue[] {
  const seen = new Set<string>();
  return issues.filter((i) => {
    // Normalize conflict messages: "A and B" === "B and A"
    let key = `${i.rule}:${i.nodePath ?? ''}:${i.message}`;
    if (i.rule === 'no-conflicting-tags' && i.message.includes(' conflict')) {
      const match = i.message.match(/Tags '([^']+)' and '([^']+)' conflict/);
      if (match) {
        const [a, b] = [match[1], match[2]].sort();
        key = `${i.rule}:${i.nodePath ?? ''}:${a}:${b}`;
      }
    }
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function checkConflictingTags(graph: Graph): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const tags = graph.config.tags ?? {};
  for (const [nodePath, node] of graph.nodes) {
    const nodeTags = node.meta.tags ?? [];
    for (const tag of nodeTags) {
      const tagDef = tags[tag];
      if (!tagDef?.conflicts_with) continue;
      for (const conflicting of tagDef.conflicts_with) {
        if (nodeTags.includes(conflicting)) {
          issues.push({
            severity: 'error',
            rule: 'no-conflicting-tags',
            message: `Tags '${tag}' and '${conflicting}' conflict`,
            nodePath,
          });
        }
      }
    }
  }
  return deduplicateIssues(issues);
}

// --- Rule 9: Context budget (warning only) ---

async function checkContextBudget(graph: Graph): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const threshold = graph.config.limits?.context_warning_tokens ?? 8000;

  for (const [nodePath, node] of graph.nodes) {
    if (node.meta.blackbox) continue;
    try {
      const pkg = await buildContext(graph, nodePath);
      if (pkg.tokenCount > threshold) {
        issues.push({
          severity: 'warning',
          rule: 'context-budget',
          message: `Context is ${pkg.tokenCount.toLocaleString()} tokens (threshold: ${threshold.toLocaleString()})`,
          nodePath,
        });
      }
    } catch {
      // If context building fails, other rules will catch it
    }
  }
  return issues;
}
