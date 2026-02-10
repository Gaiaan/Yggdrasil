# Validator

Validates the structural consistency of the graph. Implements 9 validation rules.

## Interface

- `validate(graph: Graph): Promise<ValidationResult>`

Returns `{ issues: ValidationIssue[], nodesScanned: number }` where each issue has `{ severity, rule, message, nodePath? }`.

## The 9 Rules

1. **Relation targets exist** — every `relations[].target` points to an existing node. Suggests similar paths on failure.
2. **Tags defined** — every tag in node.yaml is defined in config.yaml
3. **Aspect tags valid** — every aspect references a tag that exists in config.yaml
4. **No circular dependencies** — relations do not form cycles (DFS detection)
5. **Unique mapping paths** — no two nodes map to the same code path
6. **Directories have node.yaml** — every dir under .yggdrasil/ (except aspects/, flows/, .briefs/) that has files must have node.yaml
7. **Flow participants exist** — every node listed in flow.yaml exists
8. **No conflicting tags** — no node carries two tags declared as `conflicts_with` in config.yaml
9. **Context budget** — warns (not error) when a non-blackbox node's context exceeds `limits.context_warning_tokens`

## Constraints

- Rule 9 calls `buildContext()` for each non-blackbox node to compute token counts — this is why the relation to context-builder exists
- Issues have severity: `error` (rules 1-8) or `warning` (rule 9)
- Returns all issues, does not stop at first failure

Full specification: `documentation/06-cli-reference.md` (ygg check section)
