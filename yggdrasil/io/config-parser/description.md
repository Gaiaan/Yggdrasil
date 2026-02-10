# ConfigParser

Parses `.yggdrasil/config.yaml` into a typed `YggConfig` structure.

## Interface

- `parseConfig(filePath: string): Promise<YggConfig>`

## Behavior

- Reads and parses YAML file
- Validates required field: `name`
- Returns defaults for optional fields: `stack` = {}, `standards` = {}, `limits` = { context_warning_tokens: 8000 }, `tags` = {}
- Throws Error if file cannot be read or `name` is missing
