# GraphLoader

Orchestrates loading the entire graph from the file system into a `Graph` data structure.

## Interface

- `loadGraph(projectRoot: string): Promise<Graph>`

## Behavior

1. Finds `.yggdrasil/` directory under projectRoot (via `findYggRoot`)
2. Parses `config.yaml` using ConfigParser
3. Recursively scans directories for nodes (directories containing `node.yaml`)
4. Skips reserved directories: `aspects/`, `flows/`, `.briefs/`, and hidden dirs (starting with `.`)
5. For each node directory: parses `node.yaml`, reads artifacts, builds parent-child relationships from directory nesting
6. Loads aspects from `aspects/` directory using AspectParser
7. Loads flows from `flows/` subdirectories using FlowParser
8. Returns complete `Graph` with: config, nodes (Map<string, GraphNode>), aspects[], flows[]

## Constraints

- Node paths in the map are relative to .yggdrasil/ (e.g., "auth/login-service")
- Parent-child relationships are set via `node.parent` and `node.children` references
- Throws if .yggdrasil/ directory or config.yaml is not found

Full specification: `docs/graph-guide.md`
