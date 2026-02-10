# PathUtils

Path resolution and normalization utilities used across the CLI.

## Interface

- `getPackageRoot(): string` — returns the CLI package's root directory (uses `import.meta.url`)
- `findYggRoot(projectRoot: string): Promise<string>` — locates `.yggdrasil/` directory, throws if not found
- `normalizeMappingPaths(mapping?: NodeMapping): string[]` — converts mapping to flat array of paths (handles string, string[], or undefined)
- `toGraphPath(absolutePath: string, yggRoot: string): string` — converts absolute path to graph-relative path, normalizes separators to forward slash
