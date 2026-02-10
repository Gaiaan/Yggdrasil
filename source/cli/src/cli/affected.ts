import { Command } from 'commander';
import { loadGraph } from '../core/graph-loader.js';

export function registerAffectedCommand(program: Command): void {
  program
    .command('affected <node-path>')
    .description('Show nodes and flows that depend on a given node')
    .option('--format <format>', 'Output format: text or json', 'text')
    .action(async (nodePath: string, options: { format: string }) => {
      try {
        const graph = await loadGraph(process.cwd());

        if (!graph.nodes.has(nodePath)) {
          process.stderr.write(`Node not found: ${nodePath}\n`);
          process.exit(1);
        }

        // Find nodes that have a relation TO this node
        const dependents: { path: string; relationType: string }[] = [];
        for (const [path, node] of graph.nodes) {
          for (const rel of node.meta.relations ?? []) {
            if (rel.target === nodePath) {
              dependents.push({ path, relationType: rel.type });
            }
          }
        }

        // Find flows that include this node
        const flows = graph.flows.filter((f) => f.nodes.includes(nodePath));

        if (options.format === 'json') {
          process.stdout.write(
            JSON.stringify({ dependents, flows: flows.map((f) => f.name) }, null, 2),
          );
        } else {
          if (dependents.length > 0) {
            process.stdout.write(`Nodes depending on ${nodePath} (via relations):\n`);
            for (const d of dependents) {
              process.stdout.write(`  - ${d.path} (${d.relationType})\n`);
            }
          }
          if (flows.length > 0) {
            process.stdout.write(`\nFlows involving ${nodePath}:\n`);
            for (const f of flows) {
              process.stdout.write(`  - ${f.name}\n`);
            }
          }
          process.stdout.write(`\n${dependents.length} dependent nodes, ${flows.length} flows.\n`);
        }
      } catch (error) {
        process.stderr.write(`Error: ${(error as Error).message}\n`);
        process.exit(1);
      }
    });
}
