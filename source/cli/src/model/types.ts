// ============================================================
// Config
// ============================================================

export interface YggConfig {
  name: string;
  stack: Record<string, string>;
  standards: Record<string, string>;
  limits?: {
    context_warning_tokens?: number;
  };
  tags: Record<string, TagDefinition>;
}

export interface TagDefinition {
  description: string;
  propagates?: boolean;
  conflicts_with?: string[];
}

// ============================================================
// Node
// ============================================================

export interface NodeMeta {
  name: string;
  type: string;
  tags?: string[];
  relations?: Relation[];
  mapping?: NodeMapping;
  blackbox?: boolean;
}

export interface Relation {
  target: string; // path relative to .yggdrasil/
  type: string; // uses, calls, reads, implements, etc.
}

export interface NodeMapping {
  path: string | string[]; // single file, list of files, or directory
}

export interface GraphNode {
  /** Path relative to .yggdrasil/, e.g. "orders/order-service" */
  path: string;
  /** Parsed node.yaml content */
  meta: NodeMeta;
  /** All artifact files in the node's directory */
  artifacts: Artifact[];
  /** Child nodes (subdirectories with node.yaml) */
  children: GraphNode[];
  /** Parent node (null for top-level nodes) */
  parent: GraphNode | null;
}

export interface Artifact {
  /** Filename, e.g. "description.md" */
  filename: string;
  /** Full text content of the file */
  content: string;
}

// ============================================================
// Aspect
// ============================================================

export interface AspectDef {
  name: string;
  tag: string;
  description: string;
  requirements?: string[];
  /** Raw file content (the full YAML as string, for inclusion in context) */
  rawContent: string;
}

// ============================================================
// Flow
// ============================================================

export interface FlowDef {
  name: string;
  /** List of participating node paths (relative to .yggdrasil/) */
  nodes: string[];
  /** Artifact files in the flow directory */
  artifacts: Artifact[];
  /** Path to flow directory relative to .yggdrasil/ */
  dirPath: string;
}

// ============================================================
// Graph (top-level)
// ============================================================

export interface Graph {
  config: YggConfig;
  /** All nodes indexed by their path (e.g. "orders/order-service") */
  nodes: Map<string, GraphNode>;
  aspects: AspectDef[];
  flows: FlowDef[];
  /** Absolute path to the .yggdrasil/ directory */
  rootPath: string;
}

// ============================================================
// Context Package
// ============================================================

export interface ContextPackage {
  nodePath: string;
  nodeName: string;
  layers: ContextLayer[];
  mapping: string[] | null;
  tokenCount: number;
}

export interface ContextLayer {
  type: 'global' | 'hierarchy' | 'own' | 'relational' | 'aspects' | 'flows';
  label: string;
  content: string;
}

// ============================================================
// Dependency Resolution
// ============================================================

export interface Stage {
  stage: number;
  parallel: boolean;
  nodes: string[]; // node paths
}

// ============================================================
// Validation
// ============================================================

export type IssueSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: IssueSeverity;
  rule: string;
  message: string;
  nodePath?: string;
}

export interface ValidationResult {
  issues: ValidationIssue[];
  nodesScanned: number;
}

// ============================================================
// Drift
// ============================================================

export type DriftStatus = 'ok' | 'drift' | 'missing' | 'unmaterialized';

export interface DriftEntry {
  nodePath: string;
  mappingPaths: string[];
  status: DriftStatus;
  details?: string;
}

export interface DriftState {
  entries: Record<string, DriftStateEntry>;
}

export interface DriftStateEntry {
  path: string | string[];
  hash: string | Record<string, string>; // single hash or per-file hash map
  materialized_at: string; // ISO date
}

export interface DriftReport {
  entries: DriftEntry[];
  totalChecked: number;
  driftCount: number;
  missingCount: number;
}
