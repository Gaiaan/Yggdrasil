# FlowParser

Parses flow directories from `.yggdrasil/flows/`.

## Interface

- `parseFlow(flowDirPath: string, yggRoot: string): Promise<FlowDef>`

## Behavior

- Reads `flow.yaml` from the flow directory
- Validates required fields: `name`, `nodes` (string[])
- Reads all artifact files in the flow directory (excluding `flow.yaml`) using the same pattern as ArtifactReader
- Computes `dirPath` relative to yggdrasil root
- Returns `FlowDef` with name, nodes list, artifacts, and dirPath
