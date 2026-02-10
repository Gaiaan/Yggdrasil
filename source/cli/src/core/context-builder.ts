import type {
  Graph,
  GraphNode,
  ContextPackage,
  ContextLayer,
  YggConfig,
  AspectDef,
  FlowDef,
} from '../model/types.js';
import { normalizeMappingPaths } from '../utils/paths.js';
import { estimateTokens } from '../utils/tokens.js';

export async function buildContext(graph: Graph, nodePath: string): Promise<ContextPackage> {
  const node = graph.nodes.get(nodePath);
  if (!node) {
    throw new Error(`Node not found: ${nodePath}`);
  }

  const layers: ContextLayer[] = [];

  // Layer 1: Global
  layers.push(buildGlobalLayer(graph.config));

  // Layer 2: Hierarchy
  const ancestors = collectAncestors(node);
  for (const ancestor of ancestors) {
    layers.push(buildHierarchyLayer(ancestor));
  }

  // Layer 3: Own
  layers.push(buildOwnLayer(node));

  // Layer 4: Relational
  for (const relation of node.meta.relations ?? []) {
    const target = graph.nodes.get(relation.target);
    if (!target) {
      throw new Error(`Broken relation: ${nodePath} -> ${relation.target} (target not found)`);
    }
    layers.push(buildRelationalLayer(target, relation.type));
  }

  // Layer 5: Aspects
  const effectiveTags = resolveEffectiveTags(node, graph.config);
  for (const tag of effectiveTags) {
    for (const aspect of graph.aspects) {
      if (aspect.tag === tag) {
        layers.push(buildAspectLayer(aspect));
      }
    }
  }

  // Layer 6: Flows
  for (const flow of graph.flows) {
    if (flow.nodes.includes(nodePath)) {
      layers.push(buildFlowLayer(flow));
    }
  }

  const fullText = layers.map((l) => l.content).join('\n\n');
  const tokenCount = await estimateTokens(fullText);
  const mapping = normalizeMappingPaths(node.meta.mapping);

  return {
    nodePath,
    nodeName: node.meta.name,
    layers,
    mapping: mapping.length > 0 ? mapping : null,
    tokenCount,
  };
}

// --- Layer builders (exported for testing) ---

export function buildGlobalLayer(config: YggConfig): ContextLayer {
  let content = `**Project:** ${config.name}\n\n`;
  content += `**Stack:**\n`;
  for (const [key, value] of Object.entries(config.stack)) {
    content += `- ${key}: ${value}\n`;
  }
  content += `\n**Standards:**\n`;
  for (const [, value] of Object.entries(config.standards)) {
    content += `${value}\n`;
  }
  return { type: 'global', label: 'Global Context', content };
}

export function buildHierarchyLayer(ancestor: GraphNode): ContextLayer {
  const content = ancestor.artifacts.map((a) => `### ${a.filename}\n${a.content}`).join('\n\n');
  return {
    type: 'hierarchy',
    label: `Module Context (${ancestor.path}/)`,
    content,
  };
}

export function buildOwnLayer(node: GraphNode): ContextLayer {
  const content = node.artifacts.map((a) => `### ${a.filename}\n${a.content}`).join('\n\n');
  return {
    type: 'own',
    label: `Node: ${node.meta.name}`,
    content,
  };
}

export function buildRelationalLayer(target: GraphNode, relationType: string): ContextLayer {
  const content = target.artifacts.map((a) => `#### ${a.filename}\n${a.content}`).join('\n\n');
  return {
    type: 'relational',
    label: `${target.path} (${relationType})`,
    content,
  };
}

export function buildAspectLayer(
  aspect: Pick<AspectDef, 'name' | 'tag' | 'rawContent'>,
): ContextLayer {
  return {
    type: 'aspects',
    label: `${aspect.name} (tag: ${aspect.tag})`,
    content: aspect.rawContent,
  };
}

export function buildFlowLayer(flow: Pick<FlowDef, 'name' | 'artifacts'>): ContextLayer {
  const content = flow.artifacts.map((a) => `### ${a.filename}\n${a.content}`).join('\n\n');
  return {
    type: 'flows',
    label: flow.name,
    content,
  };
}

// --- Helpers (exported for testing) ---

export function collectAncestors(node: GraphNode): GraphNode[] {
  const ancestors: GraphNode[] = [];
  let current = node.parent;
  while (current) {
    ancestors.unshift(current); // root first
    current = current.parent;
  }
  return ancestors;
}

export function resolveEffectiveTags(node: GraphNode, config: YggConfig): string[] {
  const tags = new Set<string>(node.meta.tags ?? []);
  let current = node.parent;
  while (current) {
    for (const tag of current.meta.tags ?? []) {
      if (config.tags[tag]?.propagates) {
        tags.add(tag);
      }
    }
    current = current.parent;
  }
  return [...tags];
}
