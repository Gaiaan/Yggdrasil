# AspectParser

Parses aspect YAML files from `.yggdrasil/aspects/`.

## Interface

- `parseAspect(filePath: string): Promise<AspectDef>`

## Behavior

- Reads and parses YAML file
- Validates required fields: `name`, `tag`
- Stores the raw YAML file content in `rawContent` field — this is what gets injected into context packages (verbatim, not just the parsed fields)
- Optional fields: `description`, `requirements` (string[])
