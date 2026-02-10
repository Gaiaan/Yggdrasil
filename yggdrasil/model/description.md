# Data Model

Type definitions for all data structures in the Yggdrasil CLI. This module contains no runtime code — only TypeScript interfaces and type aliases.

All other modules import types from here. Changes to types affect the entire codebase.

## Key Types

- `Graph` — top-level container: config + nodes map + aspects + flows
- `GraphNode` — a node in the graph: metadata + artifacts + parent/children refs
- `NodeMeta` — parsed node.yaml: name, type, tags, relations, mapping, blackbox
- `YggConfig`, `TagDefinition` — parsed config.yaml
- `AspectDef`, `FlowDef` — parsed aspect/flow files
- `Artifact` — a text file: filename + content
- `ContextPackage`, `ContextLayer` — output of build-context
- `Stage` — dependency resolution stage (parallel flag + node list)
- `ValidationResult`, `ValidationIssue` — output of check
- `DriftReport`, `DriftEntry`, `DriftState` — drift detection types
