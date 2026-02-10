# ContextBuilder

Assembles a 6-layer context package for a specific node. This is the core value engine of Yggdrasil — it answers "what does an agent need to see to correctly materialize this node?"

## Interface

- `buildContext(graph: Graph, nodePath: string): Promise<ContextPackage>`

Exported helpers (used by validator for budget checks):

- `buildGlobalLayer(config: YggConfig): ContextLayer`
- `buildHierarchyLayer(ancestor: GraphNode): ContextLayer`
- `buildOwnLayer(node: GraphNode): ContextLayer`
- `buildRelationalLayer(target: GraphNode, relationType: string): ContextLayer`
- `buildAspectLayer(aspect: AspectDef): ContextLayer`
- `buildFlowLayer(flow: FlowDef): ContextLayer`
- `collectAncestors(node: GraphNode): GraphNode[]`
- `resolveEffectiveTags(node: GraphNode, config: YggConfig): string[]`

## The 6 Layers

1. **Global** — config.yaml: project name, stack, standards
2. **Hierarchy** — artifacts from ancestor nodes (root → direct parent)
3. **Own** — all artifacts from the node's own directory
4. **Relational** — all artifacts from nodes in `relations[]` (direct only, NOT transitive)
5. **Aspects** — aspect files matching node's effective tags (own + propagated from ancestors)
6. **Flows** — artifacts from flows listing this node as participant

## Constraints

- Does NOT follow transitive relations (A→B→C: A gets B's artifacts, not C's)
- Tag propagation: walks up parent chain, includes tags where `config.tags[tag].propagates === true`
- Token count estimated via `estimateTokens()` from utils/tokens
- Throws if node not found or if a relation target is missing

Full specification: `docs/spec/context-builder.md`
