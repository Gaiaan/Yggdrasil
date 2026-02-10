# DependencyResolver

Computes dependency-ordered materialization stages using topological sort.

## Interface

- `resolveDeps(graph: Graph, options: ResolveOptions): Promise<Stage[]>`
- `findChangedNodes(graph: Graph): Promise<string[]>`
- `collectTransitiveDeps(graph: Graph, nodePath: string): string[]`

ResolveOptions: `{ mode: 'all' | 'changed' | 'node', nodePath?: string }`

## Behavior

1. Collects candidate nodes based on mode:
   - `all` — all nodes with mappings (excluding blackbox)
   - `changed` — nodes whose graph files are newer than mapped code files
   - `node` — a specific node plus its transitive dependencies
2. Builds a dependency graph from `relations[]`
3. Detects circular dependencies via DFS with coloring (throws on cycle)
4. Performs topological sort (Kahn's algorithm)
5. Groups independent nodes into parallel stages (`Stage.parallel = true` when >1 node)

## Constraints

- Blackbox nodes (`blackbox: true`) are always excluded
- Nodes without mappings are excluded (nothing to materialize)
- `findChangedNodes` compares file modification times recursively (graph dir vs mapped code)
- Cycle detection throws with the cycle path in the error message

Full specification: `docs/spec/materialization.md` (dependency ordering section)
