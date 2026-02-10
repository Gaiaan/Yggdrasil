# Core Engines

Business logic layer. Each engine operates on the `Graph` type (loaded by graph-loader) and produces derived data: context packages, dependency stages, validation results, drift reports.

Engines are stateless — they take a Graph and return results. No file I/O (that is done by the IO layer and CLI layer).

## Engines

| Engine | Purpose | Key Function |
|--------|---------|-------------|
| graph-loader | Assemble Graph from files | loadGraph(projectRoot) → Graph |
| context-builder | Build 6-layer context | buildContext(graph, nodePath) → ContextPackage |
| dependency-resolver | Topological sort | resolveDeps(graph, options) → Stage[] |
| validator | 9-rule consistency check | validate(graph) → ValidationResult |
| drift-detector | Hash-based drift detection | detectDrift(graph) → DriftReport |
