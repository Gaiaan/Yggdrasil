# Phase 05 — Validator (check)

## Goal

Implement the 9 validation rules for graph consistency and the `ygg check` CLI command.

## Prerequisites

- Phase 03 complete (ContextBuilder needed for rule 9: context budget)

## Spec References

- Check command: `documentation/v2/06-cli-reference.md` lines 192-240
- Validation rules: `documentation/v2/05-workflow.md` lines 140-186
- Tag conflicts: `documentation/v2/03-graph-structure.md` lines 243-246

---

## Step 1: Create `src/core/validator.ts`

Each rule is a separate function returning `ValidationIssue[]`. The main `validate()` function runs all rules and aggregates results.

```typescript
import type {
  Graph, GraphNode, ValidationResult, ValidationIssue
} from '../model/types.js';
import { buildContext } from './context-builder.js';

export async function validate(graph: Graph): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];

  issues.push(...checkRelationTargets(graph));
  issues.push(...checkTagsDefined(graph));
  issues.push(...checkAspectTags(graph));
  issues.push(...checkNoCycles(graph));
  issues.push(...checkUniqueMappings(graph));
  issues.push(...checkDirectoriesHaveNodeYaml(graph));
  issues.push(...checkFlowParticipants(graph));
  issues.push(...checkConflictingTags(graph));
  issues.push(...await checkContextBudget(graph));

  return { issues, nodesScanned: graph.nodes.size };
}
```

### Rule 1: Relation targets exist

```typescript
function checkRelationTargets(graph: Graph): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const [nodePath, node] of graph.nodes) {
    for (const rel of node.meta.relations ?? []) {
      if (!graph.nodes.has(rel.target)) {
        // Try to suggest similar paths
        const suggestion = findSimilar(rel.target, [...graph.nodes.keys()]);
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
```

### Rule 2: Tags defined in config.yaml

```typescript
function checkTagsDefined(graph: Graph): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const definedTags = new Set(Object.keys(graph.config.tags));
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
```

### Rule 3: Aspects reference valid tags

```typescript
function checkAspectTags(graph: Graph): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const definedTags = new Set(Object.keys(graph.config.tags));
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
```

### Rule 4: No circular dependencies

Reuse cycle detection from DependencyResolver, or implement DFS with coloring:

```typescript
function checkNoCycles(graph: Graph): ValidationIssue[] {
  // DFS with WHITE/GRAY/BLACK coloring
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();
  for (const path of graph.nodes.keys()) color.set(path, WHITE);

  const issues: ValidationIssue[] = [];

  function dfs(nodePath: string, path: string[]): boolean {
    color.set(nodePath, GRAY);
    const node = graph.nodes.get(nodePath)!;
    for (const rel of node.meta.relations ?? []) {
      if (!graph.nodes.has(rel.target)) continue; // broken rel handled by rule 1
      if (color.get(rel.target) === GRAY) {
        issues.push({
          severity: 'error',
          rule: 'no-cycles',
          message: `Circular dependency: ${[...path, nodePath, rel.target].join(' -> ')}`,
        });
        return true;
      }
      if (color.get(rel.target) === WHITE) {
        if (dfs(rel.target, [...path, nodePath])) return true;
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
```

### Rule 5: Unique mapping paths

```typescript
function checkUniqueMappings(graph: Graph): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Map<string, string>(); // mapping path -> node path

  for (const [nodePath, node] of graph.nodes) {
    const paths = normalizeMappingPaths(node.meta.mapping);
    for (const mp of paths) {
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
```

### Rule 6: Directories have node.yaml

Scan yggdrasil/ for directories that have files but no node.yaml (excluding reserved dirs).

```typescript
// This requires filesystem access — scan yggdrasil/ directory
// Any directory under yggdrasil/ (except aspects/, flows/, .briefs/) that
// contains files should also contain node.yaml
```

### Rule 7: Flow participants exist

```typescript
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
```

### Rule 8: No conflicting tags

```typescript
function checkConflictingTags(graph: Graph): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const [nodePath, node] of graph.nodes) {
    const tags = node.meta.tags ?? [];
    for (const tag of tags) {
      const tagDef = graph.config.tags[tag];
      if (!tagDef?.conflicts_with) continue;
      for (const conflicting of tagDef.conflicts_with) {
        if (tags.includes(conflicting)) {
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
  // Deduplicate (A conflicts B and B conflicts A produce 2 entries)
  return deduplicateIssues(issues);
}
```

### Rule 9: Context budget (warning only)

```typescript
async function checkContextBudget(graph: Graph): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const threshold = graph.config.limits?.context_warning_tokens ?? 8000;

  for (const [nodePath, node] of graph.nodes) {
    if (node.meta.blackbox) continue; // skip blackbox nodes
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
```

---

## Step 2: Create CLI command `src/cli/check.ts`

```typescript
import { Command } from 'commander';
import { loadGraph } from '../core/graph-loader.js';
import { validate } from '../core/validator.js';
import chalk from 'chalk';

export function registerCheckCommand(program: Command): void {
  program
    .command('check')
    .description('Validate graph consistency')
    .option('--format <format>', 'Output format: text or json', 'text')
    .action(async (options) => {
      try {
        const graph = await loadGraph(process.cwd());
        const result = await validate(graph);

        if (options.format === 'json') {
          process.stdout.write(JSON.stringify(result, null, 2));
        } else {
          // Text output with checkmarks/crosses
          process.stdout.write(`${result.nodesScanned} nodes scanned\n\n`);
          const errors = result.issues.filter(i => i.severity === 'error');
          const warnings = result.issues.filter(i => i.severity === 'warning');
          for (const issue of errors) {
            const loc = issue.nodePath ? ` (${issue.nodePath})` : '';
            process.stdout.write(chalk.red(`✗ ${issue.rule}${loc}: ${issue.message}\n`));
          }
          for (const issue of warnings) {
            const loc = issue.nodePath ? ` (${issue.nodePath})` : '';
            process.stdout.write(chalk.yellow(`⚠ ${issue.rule}${loc}: ${issue.message}\n`));
          }
          if (errors.length === 0 && warnings.length === 0) {
            process.stdout.write(chalk.green('✓ No issues found.\n'));
          } else {
            process.stdout.write(`\n${errors.length} errors, ${warnings.length} warnings.\n`);
          }
        }

        const hasErrors = result.issues.some(i => i.severity === 'error');
        process.exit(hasErrors ? 1 : 0);
      } catch (error) {
        process.stderr.write(`Error: ${(error as Error).message}\n`);
        process.exit(1);
      }
    });
}
```

---

## Step 3: Tests

One positive + one negative test case per rule:
1. Valid relations → no issues. Broken relation → error with "did you mean?"
2. All tags defined → ok. Undefined tag → error
3. Aspect tag valid → ok. Aspect with undefined tag → error
4. No cycle → ok. Cycle → error with path
5. Unique mappings → ok. Duplicate mapping → error
6. All dirs have node.yaml → ok. Orphan dir → error
7. All flow participants exist → ok. Missing participant → error
8. No conflicting tags → ok. Conflicting tags → error
9. Context within budget → ok. Over budget → warning (NOT error)

Full graph fixture → 0 errors, 0 warnings.

---

## Acceptance Criteria

- [ ] All 9 validation rules implemented
- [ ] Each rule produces clear error messages with node paths
- [ ] Rule 1 suggests similar paths for broken relations
- [ ] Rule 9 is warning severity (not error) and skips blackbox nodes
- [ ] `ygg check` outputs text with ✓/✗/⚠ markers
- [ ] `ygg check --format json` outputs structured JSON
- [ ] Exit code 0 for clean, 1 for errors
- [ ] Tests pass for all rules
