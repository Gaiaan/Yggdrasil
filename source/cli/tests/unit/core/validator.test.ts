import { describe, it, expect, vi } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { validate } from '../../../src/core/validator.js';
import { loadGraph } from '../../../src/core/graph-loader.js';
import type { Graph, GraphNode, AspectDef, FlowDef } from '../../../src/model/types.js';

vi.mock('../../../src/core/context-builder.js', () => ({
  buildContext: vi.fn().mockResolvedValue({
    nodePath: 'x',
    nodeName: 'X',
    layers: [],
    mapping: null,
    tokenCount: 100,
  }),
}));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PROJECT = path.join(__dirname, '../../fixtures/sample-project');
const FIXTURE_BROKEN_RELATION = path.join(
  __dirname,
  '../../fixtures/sample-project-broken-relation',
);
const FIXTURE_ORPHAN_DIR = path.join(__dirname, '../../fixtures/sample-project-orphan-dir');
const CLI_ROOT = path.join(__dirname, '../../../..');

function createNode(nodePath: string, overrides: Partial<GraphNode['meta']> = {}): GraphNode {
  const name = nodePath.split('/').pop() ?? nodePath;
  return {
    path: nodePath,
    meta: {
      name,
      type: 'service',
      ...overrides,
    },
    artifacts: [{ filename: 'description.md', content: 'x' }],
    children: [],
    parent: null,
  };
}

function createGraph(overrides: Partial<Graph> = {}): Graph {
  return {
    config: {
      name: 'Test',
      stack: {},
      standards: {},
      tags: {
        'valid-tag': { description: 'Valid', propagates: false },
      },
    },
    nodes: new Map(),
    aspects: [],
    flows: [],
    rootPath: path.join(FIXTURE_PROJECT, '.yggdrasil'),
    ...overrides,
  };
}

describe('validator', () => {
  describe('full valid graph fixture', () => {
    it('returns 0 errors and 0 warnings for sample-project', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const result = await validate(graph);

      const errors = result.issues.filter((i) => i.severity === 'error');
      const warnings = result.issues.filter((i) => i.severity === 'warning');

      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(0);
      expect(result.nodesScanned).toBe(8);
    }, 10000);
  });

  describe('rule 1: relation-targets-exist', () => {
    it('returns no issues when all relations exist', async () => {
      const graph = createGraph();
      graph.nodes.set('a', createNode('a', { relations: [{ target: 'b', type: 'uses' }] }));
      graph.nodes.set('b', createNode('b'));

      const result = await validate(graph);
      const rule1 = result.issues.filter((i) => i.rule === 'relation-targets-exist');
      expect(rule1).toHaveLength(0);
    });

    it('returns error with "did you mean?" when relation target missing', async () => {
      const graph = createGraph();
      graph.nodes.set(
        'a',
        createNode('a', { relations: [{ target: 'users/user-servic', type: 'uses' }] }),
      );
      graph.nodes.set('users/user-repo', createNode('users/user-repo'));

      const result = await validate(graph);
      const rule1 = result.issues.filter((i) => i.rule === 'relation-targets-exist');
      expect(rule1).toHaveLength(1);
      expect(rule1[0].message).toContain('does not exist');
      expect(rule1[0].message).toContain("did you mean 'users/user-repo'");
      expect(rule1[0].nodePath).toBe('a');
    });
  });

  describe('rule 2: tags-defined', () => {
    it('returns no issues when all tags are defined', async () => {
      const graph = createGraph();
      graph.nodes.set('a', createNode('a', { tags: ['valid-tag'] }));

      const result = await validate(graph);
      const rule2 = result.issues.filter((i) => i.rule === 'tags-defined');
      expect(rule2).toHaveLength(0);
    });

    it('returns error when tag not defined in config', async () => {
      const graph = createGraph();
      graph.nodes.set('a', createNode('a', { tags: ['undefined-tag'] }));

      const result = await validate(graph);
      const rule2 = result.issues.filter((i) => i.rule === 'tags-defined');
      expect(rule2).toHaveLength(1);
      expect(rule2[0].message).toContain("'undefined-tag' not defined");
      expect(rule2[0].nodePath).toBe('a');
    });
  });

  describe('rule 3: aspect-tags-valid', () => {
    it('returns no issues when aspect tag is defined', async () => {
      const graph = createGraph({
        aspects: [
          {
            name: 'Audit',
            tag: 'valid-tag',
            description: 'x',
            rawContent: 'x',
          } as AspectDef,
        ],
      });
      graph.nodes.set('a', createNode('a'));

      const result = await validate(graph);
      const rule3 = result.issues.filter((i) => i.rule === 'aspect-tags-valid');
      expect(rule3).toHaveLength(0);
    });

    it('returns error when aspect references undefined tag', async () => {
      const graph = createGraph({
        aspects: [
          {
            name: 'Bad Aspect',
            tag: 'missing-tag',
            description: 'x',
            rawContent: 'x',
          } as AspectDef,
        ],
      });
      graph.nodes.set('a', createNode('a'));

      const result = await validate(graph);
      const rule3 = result.issues.filter((i) => i.rule === 'aspect-tags-valid');
      expect(rule3).toHaveLength(1);
      expect(rule3[0].message).toContain("'missing-tag'");
    });
  });

  describe('rule 4: no-cycles', () => {
    it('returns no issues when no cycles', async () => {
      const graph = createGraph();
      graph.nodes.set('a', createNode('a', { relations: [{ target: 'b', type: 'uses' }] }));
      graph.nodes.set('b', createNode('b'));

      const result = await validate(graph);
      const rule4 = result.issues.filter((i) => i.rule === 'no-cycles');
      expect(rule4).toHaveLength(0);
    });

    it('returns error with path when cycle exists', async () => {
      const graph = createGraph();
      graph.nodes.set('a', createNode('a', { relations: [{ target: 'b', type: 'uses' }] }));
      graph.nodes.set('b', createNode('b', { relations: [{ target: 'a', type: 'uses' }] }));

      const result = await validate(graph);
      const rule4 = result.issues.filter((i) => i.rule === 'no-cycles');
      expect(rule4).toHaveLength(1);
      expect(rule4[0].message).toContain('Circular dependency');
      expect(rule4[0].message).toContain('a');
      expect(rule4[0].message).toContain('b');
    });
  });

  describe('rule 5: unique-mappings', () => {
    it('returns no issues when mappings are unique', async () => {
      const graph = createGraph();
      graph.nodes.set('a', createNode('a', { mapping: { path: 'src/a.ts' } }));
      graph.nodes.set('b', createNode('b', { mapping: { path: 'src/b.ts' } }));

      const result = await validate(graph);
      const rule5 = result.issues.filter((i) => i.rule === 'unique-mappings');
      expect(rule5).toHaveLength(0);
    });

    it('returns error when two nodes share mapping path', async () => {
      const graph = createGraph();
      graph.nodes.set('a', createNode('a', { mapping: { path: 'src/same.ts' } }));
      graph.nodes.set('b', createNode('b', { mapping: { path: 'src/same.ts' } }));

      const result = await validate(graph);
      const rule5 = result.issues.filter((i) => i.rule === 'unique-mappings');
      expect(rule5).toHaveLength(1);
      expect(rule5[0].message).toContain('used by both');
      expect(rule5[0].message).toContain('src/same.ts');
    });
  });

  describe('rule 6: directories-have-node-yaml', () => {
    it('returns no issues when all directories have node.yaml', async () => {
      const graph = await loadGraph(FIXTURE_PROJECT);
      const result = await validate(graph);
      const rule6 = result.issues.filter((i) => i.rule === 'directories-have-node-yaml');
      expect(rule6).toHaveLength(0);
    });

    it('returns error for directory with content but no node.yaml', async () => {
      const graph = await loadGraph(FIXTURE_ORPHAN_DIR);
      const result = await validate(graph);
      const rule6 = result.issues.filter((i) => i.rule === 'directories-have-node-yaml');
      expect(rule6).toHaveLength(1);
      expect(rule6[0].message).toContain('orphan-service');
      expect(rule6[0].message).toContain('no node.yaml');
    });
  });

  describe('rule 7: flow-participants-exist', () => {
    it('returns no issues when all flow participants exist', async () => {
      const graph = createGraph({
        flows: [
          {
            name: 'Test Flow',
            nodes: ['a', 'b'],
            artifacts: [],
            dirPath: 'flows/test',
          } as FlowDef,
        ],
      });
      graph.nodes.set('a', createNode('a'));
      graph.nodes.set('b', createNode('b'));

      const result = await validate(graph);
      const rule7 = result.issues.filter((i) => i.rule === 'flow-participants-exist');
      expect(rule7).toHaveLength(0);
    });

    it('returns error when flow references non-existent node', async () => {
      const graph = createGraph({
        flows: [
          {
            name: 'Bad Flow',
            nodes: ['a', 'missing-node'],
            artifacts: [],
            dirPath: 'flows/bad',
          } as FlowDef,
        ],
      });
      graph.nodes.set('a', createNode('a'));

      const result = await validate(graph);
      const rule7 = result.issues.filter((i) => i.rule === 'flow-participants-exist');
      expect(rule7).toHaveLength(1);
      expect(rule7[0].message).toContain("'missing-node'");
      expect(rule7[0].message).toContain('Bad Flow');
    });
  });

  describe('rule 8: no-conflicting-tags', () => {
    it('returns no issues when no conflicting tags', async () => {
      const graph = createGraph({
        config: {
          name: 'Test',
          stack: {},
          standards: {},
          tags: {
            a: { description: 'A', propagates: false },
            b: { description: 'B', propagates: false },
          },
        },
      });
      graph.nodes.set('n', createNode('n', { tags: ['a', 'b'] }));

      const result = await validate(graph);
      const rule8 = result.issues.filter((i) => i.rule === 'no-conflicting-tags');
      expect(rule8).toHaveLength(0);
    });

    it('returns error when node has conflicting tags', async () => {
      const graph = createGraph({
        config: {
          name: 'Test',
          stack: {},
          standards: {},
          tags: {
            'server-only': {
              description: 'Server',
              propagates: false,
              conflicts_with: ['client-interactive'],
            },
            'client-interactive': {
              description: 'Client',
              propagates: false,
              conflicts_with: ['server-only'],
            },
          },
        },
      });
      graph.nodes.set('n', createNode('n', { tags: ['server-only', 'client-interactive'] }));

      const result = await validate(graph);
      const rule8 = result.issues.filter((i) => i.rule === 'no-conflicting-tags');
      expect(rule8).toHaveLength(1);
      expect(rule8[0].message).toContain('conflict');
      expect(rule8[0].nodePath).toBe('n');
    });
  });

  describe('rule 9: context-budget', () => {
    it('returns no issues when context within budget', async () => {
      const { buildContext } = await import('../../../src/core/context-builder.js');
      vi.mocked(buildContext).mockResolvedValue({
        nodePath: 'a',
        nodeName: 'A',
        layers: [],
        mapping: null,
        tokenCount: 100,
      } as Awaited<ReturnType<typeof buildContext>>);

      const graph = createGraph();
      graph.nodes.set('a', createNode('a'));

      const result = await validate(graph);
      const rule9 = result.issues.filter((i) => i.rule === 'context-budget');
      expect(rule9).toHaveLength(0);
    });

    it('returns warning (not error) when over budget', async () => {
      const { buildContext } = await import('../../../src/core/context-builder.js');
      vi.mocked(buildContext).mockResolvedValue({
        nodePath: 'a',
        nodeName: 'A',
        layers: [],
        mapping: null,
        tokenCount: 15000,
      } as Awaited<ReturnType<typeof buildContext>>);

      const graph = createGraph();
      graph.nodes.set('a', createNode('a'));

      const result = await validate(graph);
      const rule9 = result.issues.filter((i) => i.rule === 'context-budget');
      expect(rule9).toHaveLength(1);
      expect(rule9[0].severity).toBe('warning');
      expect(rule9[0].message).toContain('15,000');
    });

    it('skips blackbox nodes', async () => {
      const { buildContext } = await import('../../../src/core/context-builder.js');
      vi.mocked(buildContext).mockClear();

      const graph = createGraph();
      graph.nodes.set('a', createNode('a', { blackbox: true }));

      const result = await validate(graph);
      const rule9 = result.issues.filter((i) => i.rule === 'context-budget');
      expect(rule9).toHaveLength(0);
      expect(buildContext).not.toHaveBeenCalled();
    });
  });

  describe('rule 4: no-cycles (3+ nodes)', () => {
    it('detects cycle A→B→C→A', async () => {
      const graph = createGraph();
      graph.nodes.set('a', createNode('a', { relations: [{ target: 'b', type: 'uses' }] }));
      graph.nodes.set('b', createNode('b', { relations: [{ target: 'c', type: 'uses' }] }));
      graph.nodes.set('c', createNode('c', { relations: [{ target: 'a', type: 'uses' }] }));

      const result = await validate(graph);
      const rule4 = result.issues.filter((i) => i.rule === 'no-cycles');
      expect(rule4).toHaveLength(1);
      expect(rule4[0].message).toContain('Circular dependency');
    });

    it('skips missing relation targets during cycle check (does not crash)', async () => {
      // Node "a" relates to "b" (exists) and "missing" (does not exist)
      // Cycle check should skip the missing target; relation-targets-exist catches it
      const graph = createGraph();
      graph.nodes.set(
        'a',
        createNode('a', {
          relations: [
            { target: 'b', type: 'uses' },
            { target: 'missing', type: 'uses' },
          ],
        }),
      );
      graph.nodes.set('b', createNode('b'));

      const result = await validate(graph);
      const cycleIssues = result.issues.filter((i) => i.rule === 'no-cycles');
      expect(cycleIssues).toHaveLength(0); // no cycle, missing target is fine

      const relationIssues = result.issues.filter((i) => i.rule === 'relation-targets-exist');
      expect(relationIssues).toHaveLength(1);
      expect(relationIssues[0].message).toContain('missing');
    });
  });

  describe('rule 1: findSimilar edge cases', () => {
    it('returns no suggestion when target is completely unrelated', async () => {
      const graph = createGraph();
      graph.nodes.set(
        'a',
        createNode('a', { relations: [{ target: 'completely/wrong/path', type: 'uses' }] }),
      );
      graph.nodes.set('other/node', createNode('other/node'));

      const result = await validate(graph);
      const rule1 = result.issues.filter((i) => i.rule === 'relation-targets-exist');
      expect(rule1).toHaveLength(1);
      expect(rule1[0].message).toContain('does not exist');
      // No "did you mean" because no path segments match
      expect(rule1[0].message).not.toContain('did you mean');
    });

    it('returns no suggestion when graph has no other nodes', async () => {
      const graph = createGraph();
      graph.nodes.set('a', createNode('a', { relations: [{ target: 'nobody', type: 'uses' }] }));

      const result = await validate(graph);
      const rule1 = result.issues.filter((i) => i.rule === 'relation-targets-exist');
      expect(rule1).toHaveLength(1);
      expect(rule1[0].message).not.toContain('did you mean');
    });
  });

  describe('rule 5: empty mapping path', () => {
    it('skips empty string mapping paths during uniqueness check', async () => {
      const graph = createGraph();
      graph.nodes.set('a', createNode('a', { mapping: { path: '' } }));
      graph.nodes.set('b', createNode('b', { mapping: { path: '' } }));

      const result = await validate(graph);
      const rule5 = result.issues.filter((i) => i.rule === 'unique-mappings');
      expect(rule5).toHaveLength(0); // empty paths are skipped
    });
  });

  describe('rule 8: deduplication', () => {
    it('deduplicates symmetric conflicting tag issues (A conflicts B = B conflicts A)', async () => {
      const graph = createGraph({
        config: {
          name: 'Test',
          stack: {},
          standards: {},
          tags: {
            x: { description: 'X', propagates: false, conflicts_with: ['y'] },
            y: { description: 'Y', propagates: false, conflicts_with: ['x'] },
          },
        },
      });
      // Both x→y and y→x would fire, but dedup should collapse to 1
      graph.nodes.set('n', createNode('n', { tags: ['x', 'y'] }));

      const result = await validate(graph);
      const rule8 = result.issues.filter((i) => i.rule === 'no-conflicting-tags');
      expect(rule8).toHaveLength(1); // deduplicated, not 2
    });
  });

  describe('rule 9: context-budget with custom threshold', () => {
    it('uses default 8000 threshold when limits not defined', async () => {
      const { buildContext } = await import('../../../src/core/context-builder.js');
      vi.mocked(buildContext).mockResolvedValue({
        nodePath: 'a',
        nodeName: 'A',
        layers: [],
        mapping: null,
        tokenCount: 9000,
      } as Awaited<ReturnType<typeof buildContext>>);

      const graph = createGraph({
        config: {
          name: 'Test',
          stack: {},
          standards: {},
          tags: {},
          limits: undefined, // no limits defined
        },
      });
      graph.nodes.set('a', createNode('a'));

      const result = await validate(graph);
      const rule9 = result.issues.filter((i) => i.rule === 'context-budget');
      expect(rule9).toHaveLength(1); // 9000 > default 8000
      expect(rule9[0].severity).toBe('warning');
    });

    it('catches buildContext error gracefully (other rules report it)', async () => {
      const { buildContext } = await import('../../../src/core/context-builder.js');
      vi.mocked(buildContext).mockRejectedValueOnce(new Error('boom'));

      const graph = createGraph();
      graph.nodes.set('a', createNode('a'));

      const result = await validate(graph);
      const rule9 = result.issues.filter((i) => i.rule === 'context-budget');
      expect(rule9).toHaveLength(0); // error caught, no warning
    });
  });

  describe('multiple rules breaking at once', () => {
    it('reports errors from multiple rules simultaneously', async () => {
      const { buildContext } = await import('../../../src/core/context-builder.js');
      vi.mocked(buildContext).mockResolvedValue({
        nodePath: 'a',
        nodeName: 'A',
        layers: [],
        mapping: null,
        tokenCount: 100,
      } as Awaited<ReturnType<typeof buildContext>>);

      const graph = createGraph({
        config: {
          name: 'Test',
          stack: {},
          standards: {},
          tags: { 'valid-tag': { description: 'Valid', propagates: false } },
        },
        flows: [
          {
            name: 'Bad Flow',
            nodes: ['a', 'ghost'],
            artifacts: [],
            dirPath: 'flows/bad',
          } as FlowDef,
        ],
      });
      // rule 1: broken relation + rule 2: undefined tag + rule 5: dup mapping + rule 7: flow
      graph.nodes.set(
        'a',
        createNode('a', {
          relations: [{ target: 'missing', type: 'uses' }],
          tags: ['nonexistent-tag'],
          mapping: { path: 'src/dup.ts' },
        }),
      );
      graph.nodes.set(
        'b',
        createNode('b', {
          mapping: { path: 'src/dup.ts' }, // duplicate mapping
        }),
      );

      const result = await validate(graph);
      const ruleNames = [...new Set(result.issues.map((i) => i.rule))];

      expect(ruleNames).toContain('relation-targets-exist');
      expect(ruleNames).toContain('tags-defined');
      expect(ruleNames).toContain('unique-mappings');
      expect(ruleNames).toContain('flow-participants-exist');
      expect(result.issues.filter((i) => i.severity === 'error').length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('CLI exit codes', () => {
    it('exit code 1 when errors exist', () => {
      const fixturePath = path.resolve(
        CLI_ROOT,
        'tests',
        'fixtures',
        'sample-project-broken-relation',
      );
      const binPath = path.resolve(CLI_ROOT, 'dist', 'bin.js');
      const result = spawnSync('node', [binPath, 'check'], {
        cwd: fixturePath,
        encoding: 'utf-8',
      });
      if (result.error) {
        // Skip in environments where spawn is not available (e.g. sandbox)
        if (result.error.message?.includes('ENOENT')) {
          return;
        }
        throw result.error;
      }
      expect(result.status).toBe(1);
    });

    it('exit code 0 when no errors (warnings alone do not cause exit 1)', () => {
      const fixturePath = path.resolve(CLI_ROOT, 'tests', 'fixtures', 'sample-project');
      const binPath = path.resolve(CLI_ROOT, 'dist', 'bin.js');
      const result = spawnSync('node', [binPath, 'check'], {
        cwd: fixturePath,
        encoding: 'utf-8',
      });
      if (result.error) {
        if (result.error.message?.includes('ENOENT')) {
          return;
        }
        throw result.error;
      }
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('nodes scanned');
      expect(result.stdout).toMatch(/✓|No issues/);
    });
  });
});
