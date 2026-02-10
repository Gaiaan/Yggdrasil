# MarkdownFormatter

Formats a ContextPackage into a markdown document for agent consumption.

## Interface

- `formatContextMarkdown(pkg: ContextPackage): string`

## Output Structure

```
# Context Package: {nodeName}
# Path: {nodePath}
# Generated: {ISO timestamp}
---
## {layer.label}
{layer.content}
---
## Materialization Target
**Mapping:** {paths}
---
Context size: {tokenCount} tokens
Layers: {layer types}
```

## Constraints

- Each layer gets a `##` section header with its label
- Layers separated by `---` horizontal rules
- Footer includes token count and layer type summary
- Materialization target section only included if mapping exists
