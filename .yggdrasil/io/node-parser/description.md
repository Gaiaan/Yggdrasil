# NodeParser

Parses `node.yaml` files into typed `NodeMeta` structures.

## Interface

- `parseNodeYaml(filePath: string): Promise<NodeMeta>`

## Behavior

- Reads and parses YAML file
- Validates required fields: `name`, `type`
- Normalizes `mapping.path` — accepts string or string[], stores as-is
- Defaults: `tags` = [], `relations` = [], `blackbox` = false, `mapping` = undefined
- Throws Error if `name` or `type` is missing
