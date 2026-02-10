# JsonFormatter

Formats a ContextPackage as a JSON string.

## Interface

- `formatContextJson(pkg: ContextPackage): string`

## Output

Pretty-printed JSON (2-space indent) containing all ContextPackage fields:

- `nodePath`, `nodeName`, `generatedAt` (ISO timestamp)
- `layers[]` — array with type, label, content per layer
- `mapping` — string[] or null
- `tokenCount` — estimated token count
