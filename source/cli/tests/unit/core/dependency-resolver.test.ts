import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stat, readdir } from 'node:fs/promises';

vi.mock('node:fs/promises', () => ({
  stat: vi.fn(),
  readdir: vi.fn(),
}));
import {
  resolveDeps,
  findChangedNodes,
  collectTransitiveDeps,
} from '../../../src/core/dependency-resolver.js';
import type { Graph, GraphNode } from '../../../src/model/types.js';

function createNode(
  path: string,
  relations: { target: string; type: string }[] = [],
  mapping?: { path: string },
  blackbox = false,
): GraphNode {
  return {
    path,
    meta: {
      name: path.split('/').pop() ?? path,
      type: 'service',
      relations: relations.length > 0 ? relations : undefined,
      mapping,
      blackbox,
    },
    artifacts: [],
    children: [],
    parent: null,
  };
}

function createGraph(nodes: GraphNode[], rootPath = '/tmp/.yggdrasil'): Graph {
  const nodeMap = new Map<string, GraphNode>();
  for (const n of nodes) {
    nodeMap.set(n.path, n);
  }
  return {
    config: { name: 'Test', stack: {}, standards: {}, tags: {} },
    nodes: nodeMap,
    aspects: [],
    flows: [],
    rootPath,
  };
}

describe('dependency-resolver', () => {
  describe('resolveDeps - linear chain A→B→C', () => {
    it('produces stages [C], [B], [A]', async () => {
      const graph = createGraph([
        createNode('A', [{ target: 'B', type: 'uses' }], { path: 'a.ts' }),
        createNode('B', [{ target: 'C', type: 'uses' }], { path: 'b.ts' }),
        createNode('C', [], { path: 'c.ts' }),
      ]);

      const stages = await resolveDeps(graph, { mode: 'all' });

      expect(stages).toHaveLength(3);
      expect(stages[0].stage).toBe(1);
      expect(stages[0].nodes).toEqual(['C']);
      expect(stages[0].parallel).toBe(false);

      expect(stages[1].stage).toBe(2);
      expect(stages[1].nodes).toEqual(['B']);
      expect(stages[1].parallel).toBe(false);

      expect(stages[2].stage).toBe(3);
      expect(stages[2].nodes).toEqual(['A']);
      expect(stages[2].parallel).toBe(false);
    });
  });

  describe('resolveDeps - diamond A→B,C B,C→D', () => {
    it('produces stages [D], [B,C], [A]', async () => {
      const graph = createGraph([
        createNode(
          'A',
          [
            { target: 'B', type: 'uses' },
            { target: 'C', type: 'uses' },
          ],
          { path: 'a.ts' },
        ),
        createNode('B', [{ target: 'D', type: 'uses' }], { path: 'b.ts' }),
        createNode('C', [{ target: 'D', type: 'uses' }], { path: 'c.ts' }),
        createNode('D', [], { path: 'd.ts' }),
      ]);

      const stages = await resolveDeps(graph, { mode: 'all' });

      expect(stages).toHaveLength(3);
      expect(stages[0].nodes).toEqual(['D']);
      expect(stages[0].parallel).toBe(false);

      expect(stages[1].nodes).toHaveLength(2);
      expect(stages[1].nodes).toContain('B');
      expect(stages[1].nodes).toContain('C');
      expect(stages[1].parallel).toBe(true);

      expect(stages[2].nodes).toEqual(['A']);
      expect(stages[2].parallel).toBe(false);
    });
  });

  describe('resolveDeps - independent nodes', () => {
    it('produces single parallel stage', async () => {
      const graph = createGraph([
        createNode('A', [], { path: 'a.ts' }),
        createNode('B', [], { path: 'b.ts' }),
        createNode('C', [], { path: 'c.ts' }),
      ]);

      const stages = await resolveDeps(graph, { mode: 'all' });

      expect(stages).toHaveLength(1);
      expect(stages[0].nodes).toHaveLength(3);
      expect(stages[0].nodes).toContain('A');
      expect(stages[0].nodes).toContain('B');
      expect(stages[0].nodes).toContain('C');
      expect(stages[0].parallel).toBe(true);
    });
  });

  describe('resolveDeps - cycle detection', () => {
    it('throws when A→B, B→A', async () => {
      const graph = createGraph([
        createNode('A', [{ target: 'B', type: 'uses' }], { path: 'a.ts' }),
        createNode('B', [{ target: 'A', type: 'uses' }], { path: 'b.ts' }),
      ]);

      await expect(resolveDeps(graph, { mode: 'all' })).rejects.toThrow(
        /Circular dependency detected involving/,
      );
    });
  });

  describe('resolveDeps - broken relation in candidates', () => {
    it('throws when relation target does not exist in graph', async () => {
      const graph = createGraph([
        createNode('A', [{ target: 'nonexistent', type: 'uses' }], { path: 'a.ts' }),
      ]);

      await expect(resolveDeps(graph, { mode: 'all' })).rejects.toThrow(
        'Relation target not found: nonexistent',
      );
    });
  });

  describe('resolveDeps - blackbox exclusion', () => {
    it('excludes blackbox nodes from stages', async () => {
      const graph = createGraph([
        createNode('A', [{ target: 'B', type: 'uses' }], { path: 'a.ts' }),
        createNode('B', [], { path: 'b.ts' }, true), // blackbox
      ]);

      const stages = await resolveDeps(graph, { mode: 'all' });

      expect(stages).toHaveLength(1);
      expect(stages[0].nodes).toEqual(['A']);
      expect(stages[0].nodes).not.toContain('B');
    });
  });

  describe('resolveDeps - nodes without mapping', () => {
    it('excludes nodes without mapping from stages', async () => {
      const graph = createGraph([
        createNode('A', [{ target: 'B', type: 'uses' }], { path: 'a.ts' }),
        createNode('B', [], undefined), // no mapping
      ]);

      const stages = await resolveDeps(graph, { mode: 'all' });

      expect(stages).toHaveLength(1);
      expect(stages[0].nodes).toEqual(['A']);
      expect(stages[0].nodes).not.toContain('B');
    });
  });

  describe('collectTransitiveDeps', () => {
    it('returns node and its transitive dependencies', () => {
      const graph = createGraph([
        createNode('A', [{ target: 'B', type: 'uses' }], { path: 'a.ts' }),
        createNode('B', [{ target: 'C', type: 'uses' }], { path: 'b.ts' }),
        createNode('C', [], { path: 'c.ts' }),
      ]);

      const deps = collectTransitiveDeps(graph, 'A');

      expect(deps).toHaveLength(3);
      expect(deps).toContain('A');
      expect(deps).toContain('B');
      expect(deps).toContain('C');
    });

    it('throws when node not found', () => {
      const graph = createGraph([createNode('A', [], { path: 'a.ts' })]);

      expect(() => collectTransitiveDeps(graph, 'X')).toThrow('Node not found: X');
    });

    it('throws when relation target not found', () => {
      const graph = createGraph([
        createNode('A', [{ target: 'missing', type: 'uses' }], { path: 'a.ts' }),
      ]);

      expect(() => collectTransitiveDeps(graph, 'A')).toThrow('Relation target not found: missing');
    });
  });

  describe('resolveDeps - node mode', () => {
    it('includes only specified node and its transitive deps', async () => {
      const graph = createGraph([
        createNode('A', [{ target: 'B', type: 'uses' }], { path: 'a.ts' }),
        createNode('B', [{ target: 'C', type: 'uses' }], { path: 'b.ts' }),
        createNode('C', [], { path: 'c.ts' }),
      ]);

      const stages = await resolveDeps(graph, { mode: 'node', nodePath: 'A' });

      expect(stages).toHaveLength(3);
      expect(stages[0].nodes).toEqual(['C']);
      expect(stages[1].nodes).toEqual(['B']);
      expect(stages[2].nodes).toEqual(['A']);
    });
  });

  describe('resolveDeps - empty graph (no nodes with mapping)', () => {
    it('returns empty stages when no nodes have mapping', async () => {
      const graph = createGraph([createNode('A', [], undefined), createNode('B', [], undefined)]);

      const stages = await resolveDeps(graph, { mode: 'all' });
      expect(stages).toHaveLength(0);
    });
  });

  describe('collectTransitiveDeps - diamond', () => {
    it('handles diamond-shaped dependencies without duplicates', () => {
      const graph = createGraph([
        createNode(
          'A',
          [
            { target: 'B', type: 'uses' },
            { target: 'C', type: 'uses' },
          ],
          { path: 'a.ts' },
        ),
        createNode('B', [{ target: 'D', type: 'uses' }], { path: 'b.ts' }),
        createNode('C', [{ target: 'D', type: 'uses' }], { path: 'c.ts' }),
        createNode('D', [], { path: 'd.ts' }),
      ]);

      const deps = collectTransitiveDeps(graph, 'A');
      expect(deps).toHaveLength(4);
      expect(deps).toContain('A');
      expect(deps).toContain('B');
      expect(deps).toContain('C');
      expect(deps).toContain('D');
    });
  });

  describe('resolveDeps - changed mode', () => {
    it('uses changed mode to filter nodes', async () => {
      vi.mocked(stat).mockImplementation(async (p: unknown) => {
        const s = String(p);
        if (s.includes('.yggdrasil/changed') && !s.includes('src')) {
          return { mtimeMs: 2000 } as Awaited<ReturnType<typeof stat>>;
        }
        return { mtimeMs: 1000 } as Awaited<ReturnType<typeof stat>>;
      });

      vi.mocked(readdir).mockImplementation(async (dir: unknown) => {
        const d = String(dir);
        if (d.endsWith('changed')) {
          return [{ name: 'node.yaml', isDirectory: () => false }] as Awaited<
            ReturnType<typeof readdir>
          >;
        }
        return [];
      });

      const graph = createGraph(
        [
          createNode('changed', [], { path: 'src/changed.ts' }),
          createNode('unchanged', [], { path: 'src/unchanged.ts' }),
        ],
        '/tmp/test-ygg/.yggdrasil',
      );

      const stages = await resolveDeps(graph, { mode: 'changed' });
      const allNodes = stages.flatMap((s) => s.nodes);
      expect(allNodes).toContain('changed');
      expect(allNodes).not.toContain('unchanged');
    });
  });

  describe('findChangedNodes - --changed mode', () => {
    const rootPath = '/tmp/test-ygg/.yggdrasil';

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('skips blackbox nodes', async () => {
      vi.mocked(stat).mockImplementation(async () => {
        return { mtimeMs: 2000 } as Awaited<ReturnType<typeof stat>>;
      });
      vi.mocked(readdir).mockImplementation(
        async () =>
          [{ name: 'node.yaml', isDirectory: () => false }] as Awaited<ReturnType<typeof readdir>>,
      );

      const graph = createGraph(
        [
          createNode('blackbox-node', [], { path: 'src/bb.ts' }, true), // blackbox
          createNode('normal-node', [], { path: 'src/normal.ts' }),
        ],
        rootPath,
      );

      const changed = await findChangedNodes(graph);
      expect(changed).not.toContain('blackbox-node');
    });

    it('skips nodes without mapping', async () => {
      vi.mocked(stat).mockImplementation(async () => {
        return { mtimeMs: 2000 } as Awaited<ReturnType<typeof stat>>;
      });
      vi.mocked(readdir).mockImplementation(
        async () =>
          [{ name: 'node.yaml', isDirectory: () => false }] as Awaited<ReturnType<typeof readdir>>,
      );

      const graph = createGraph(
        [
          createNode('no-mapping', []), // no mapping
        ],
        rootPath,
      );

      const changed = await findChangedNodes(graph);
      expect(changed).not.toContain('no-mapping');
    });

    it('handles node directory with subdirectories (recursive mtime)', async () => {
      // Simulate a node dir that has subdirectories — getLatestMtime recurses into them
      vi.mocked(readdir).mockImplementation(async (dir: unknown) => {
        const d = String(dir);
        if (d.endsWith('deep-node')) {
          return [
            { name: 'node.yaml', isFile: () => true, isDirectory: () => false },
            { name: 'subdir', isFile: () => false, isDirectory: () => true },
          ] as Awaited<ReturnType<typeof readdir>>;
        }
        if (d.endsWith('subdir')) {
          return [{ name: 'notes.md', isFile: () => true, isDirectory: () => false }] as Awaited<
            ReturnType<typeof readdir>
          >;
        }
        return [];
      });

      vi.mocked(stat).mockImplementation(async (p: unknown) => {
        const s = String(p);
        if (s.includes('subdir') && s.includes('notes.md')) {
          return { mtimeMs: 3000 } as Awaited<ReturnType<typeof stat>>; // newest
        }
        if (s.includes('node.yaml')) {
          return { mtimeMs: 1000 } as Awaited<ReturnType<typeof stat>>;
        }
        // Code file
        return { mtimeMs: 2000 } as Awaited<ReturnType<typeof stat>>;
      });

      const graph = createGraph([createNode('deep-node', [], { path: 'src/deep.ts' })], rootPath);

      const changed = await findChangedNodes(graph);
      // subdir/notes.md (3000) > code file (2000), so graph is newer
      expect(changed).toContain('deep-node');
    });

    it('includes nodes whose graph is newer than code', async () => {
      vi.mocked(stat).mockImplementation(async (p: unknown) => {
        const s = String(p);
        if (s.includes('.yggdrasil') && !s.includes('src')) {
          return { mtimeMs: 2000 } as Awaited<ReturnType<typeof stat>>;
        }
        if (s.includes('src')) {
          return { mtimeMs: 1000 } as Awaited<ReturnType<typeof stat>>;
        }
        return { mtimeMs: 0 } as Awaited<ReturnType<typeof stat>>;
      });

      vi.mocked(readdir).mockImplementation(async (dir: unknown) => {
        const d = String(dir);
        if (d.endsWith('changed-node')) {
          return [{ name: 'node.yaml', isDirectory: () => false }] as Awaited<
            ReturnType<typeof readdir>
          >;
        }
        return [];
      });

      const graph = createGraph(
        [createNode('changed-node', [], { path: 'src/changed-node.ts' })],
        rootPath,
      );

      const changed = await findChangedNodes(graph);

      expect(changed).toContain('changed-node');
    });

    it('includes nodes whose code file does not exist', async () => {
      vi.mocked(stat).mockImplementation(async (p: unknown) => {
        const s = String(p);
        if (s.includes('src/') && s.includes('missing')) {
          throw new Error('ENOENT');
        }
        return { mtimeMs: 1000 } as Awaited<ReturnType<typeof stat>>;
      });

      vi.mocked(readdir).mockImplementation(
        async () =>
          [{ name: 'node.yaml', isDirectory: () => false }] as Awaited<ReturnType<typeof readdir>>,
      );

      const graph = createGraph(
        [createNode('missing-code', [], { path: 'src/missing.ts' })],
        rootPath,
      );

      const changed = await findChangedNodes(graph);

      expect(changed).toContain('missing-code');
    });

    it('expands with dependents (cascade)', async () => {
      vi.mocked(stat).mockImplementation(async (p: string) => {
        const s = String(p);
        if (s.includes('.yggdrasil/base') && !s.includes('src')) {
          return { mtimeMs: 2000 } as Awaited<ReturnType<typeof stat>>;
        }
        return { mtimeMs: 1000 } as Awaited<ReturnType<typeof stat>>;
      });

      vi.mocked(readdir).mockImplementation(async (dir: unknown) => {
        const d = String(dir);
        if (d.endsWith('base') || d.endsWith('dependent')) {
          return [{ name: 'node.yaml', isDirectory: () => false }] as Awaited<
            ReturnType<typeof readdir>
          >;
        }
        return [];
      });

      const graph = createGraph(
        [
          createNode('base', [], { path: 'src/base.ts' }),
          createNode('dependent', [{ target: 'base', type: 'uses' }], {
            path: 'src/dependent.ts',
          }),
        ],
        rootPath,
      );

      const changed = await findChangedNodes(graph);

      expect(changed).toContain('base');
      expect(changed).toContain('dependent');
    });
  });
});
