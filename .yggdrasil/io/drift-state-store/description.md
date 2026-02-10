# DriftStateStore

Reads and writes the `.drift-state` YAML file that tracks materialization hashes.

## Interface

- `readDriftState(yggRoot: string): Promise<DriftState>`
- `writeDriftState(yggRoot: string, state: DriftState): Promise<void>`

## Behavior

- File location: `.yggdrasil/.drift-state`
- `readDriftState`: returns empty `{ entries: {} }` if file does not exist
- `writeDriftState`: writes YAML with auto-generated header comment, records file hashes (sha256) and materialization timestamps per node path
- Format: `entries` map where key = node path, value = `{ path, hash, materialized_at }`
