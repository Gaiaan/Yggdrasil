import { Command } from 'commander';
import { loadGraph } from '../core/graph-loader.js';
import type { GraphNode } from '../model/types.js';
import chalk from 'chalk';

export function registerTreeCommand(program: Command): void {
  program
    .command('tree')
    .description('Display graph as a tree')
    .argument('[path]', 'Show only subtree rooted at this path')
    .option('--depth <n>', 'Maximum depth', (v) => parseInt(v, 10))
    .option('--compact', 'Hide metadata (artifact counts, mapping paths)')
    .option('--no-tags', 'Hide tags')
    .action(async (pathArg: string | undefined, options: { depth?: number; compact?: boolean; tags?: boolean }) => {
      try {
        const graph = await loadGraph(process.cwd());

        let roots: GraphNode[];
        let showProjectName: boolean;

        if (pathArg?.trim()) {
          const path = pathArg.trim().replace(/\/$/, '');
          const node = graph.nodes.get(path);
          if (!node) {
            process.stderr.write(`Error: path '${path}' not found\n`);
            process.exit(1);
          }
          roots = [node];
          showProjectName = false;
        } else {
          roots = [...graph.nodes.values()]
            .filter((n) => n.parent === null)
            .sort((a, b) => a.path.localeCompare(b.path));
          showProjectName = true;
        }

        if (showProjectName) {
          process.stdout.write(`${graph.config.name}\n`);
        }

        for (let i = 0; i < roots.length; i++) {
          const isLast = i === roots.length - 1;
          printNode(
            roots[i],
            showProjectName ? '' : '',
            isLast,
            1,
            options.depth,
            options.tags !== false,
            options.compact ?? false,
          );
        }
      } catch (error) {
        process.stderr.write(`Error: ${(error as Error).message}\n`);
        process.exit(1);
      }
    });
}

function printNode(
  node: GraphNode,
  prefix: string,
  isLast: boolean,
  depth: number,
  maxDepth: number | undefined,
  showTags: boolean,
  compact: boolean,
): void {
  const connector = isLast ? '└── ' : '├── ';
  const name = node.path.split('/').pop() ?? node.path;
  const type = `(${node.meta.type})`;
  const tags =
    showTags && node.meta.tags?.length
      ? chalk.dim(` [${node.meta.tags.join(', ')}]`)
      : '';
  const blackbox = node.meta.blackbox ? chalk.dim(' [blackbox]') : '';

  process.stdout.write(
    `${prefix}${connector}${name}/ ${type}${tags}${blackbox}\n`,
  );

  const childPrefix = prefix + (isLast ? '    ' : '│   ');

  if (!compact) {
    const artifactCount = node.artifacts.length;
    const mapping = node.meta.mapping
      ? Array.isArray(node.meta.mapping.path)
        ? node.meta.mapping.path.join(', ')
        : node.meta.mapping.path
      : null;
    const meta = `${artifactCount} artifacts${mapping ? `, mapping: ${mapping}` : ''}`;
    const hasChildren = node.children.length > 0;
    const metaConnector = hasChildren ? '├── ' : '└── ';
    process.stdout.write(`${childPrefix}${metaConnector}${chalk.dim(meta)}\n`);
  }

  // Recurse into children
  if (maxDepth !== undefined && depth >= maxDepth) return;

  const children = [...node.children].sort((a, b) =>
    a.path.localeCompare(b.path),
  );
  for (let i = 0; i < children.length; i++) {
    printNode(
      children[i],
      childPrefix,
      i === children.length - 1,
      depth + 1,
      maxDepth,
      showTags,
      compact,
    );
  }
}
