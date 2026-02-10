# IO Parsers

File I/O layer. Each parser reads a specific file format from the .yggdrasil/ directory and returns a typed data structure. Parsers are pure functions — no graph-level logic, no cross-file resolution.

All parsers use the `yaml` library for YAML parsing and types from `model/types.ts`.

## Parsers

| Parser | Input | Output |
|--------|-------|--------|
| config-parser | config.yaml | YggConfig |
| node-parser | node.yaml | NodeMeta |
| artifact-reader | directory path | Artifact[] |
| aspect-parser | aspect .yaml file | AspectDef |
| flow-parser | flow directory | FlowDef |
| drift-state-store | .drift-state | DriftState (read/write) |
