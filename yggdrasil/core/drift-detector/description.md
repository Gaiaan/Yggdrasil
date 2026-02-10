# DriftDetector

Detects divergence between graph expectations and actual code on disk by comparing content hashes.

## Interface

- `detectDrift(graph: Graph, filterNodePath?: string): Promise<DriftReport>`
- `absorbDrift(graph: Graph, nodePath: string): Promise<void>`

## Behavior

### detectDrift

For each node with a mapping:

1. Read the `.drift-state` file (via DriftStateStore)
2. If no entry exists → status: `unmaterialized`
3. If mapped file doesn't exist on disk → status: `missing`
4. Compute SHA-256 hash of current file and compare to stored hash
5. If different → status: `drift` (details say which file changed)
6. If same → status: `ok`

Supports multi-file mappings: hashes each file independently, reports drift per file.

### absorbDrift

1. Read current file(s) at the node's mapping path(s)
2. Compute SHA-256 hash for each
3. Update `.drift-state` with new hashes and current timestamp
4. Write state via DriftStateStore

## Constraints

- Uses SHA-256 via node:crypto (from utils/hash)
- Drift state stored in `.yggdrasil/.drift-state` (YAML format)
- `filterNodePath` parameter limits detection to a single node

Full specification: `docs/spec/drift-detection.md`
