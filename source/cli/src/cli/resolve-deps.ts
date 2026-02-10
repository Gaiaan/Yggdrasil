import { Command } from 'commander';
import { loadGraph } from '../core/graph-loader.js';
import { resolveDeps } from '../core/dependency-resolver.js';

export function registerResolveDepsCommand(program: Command): void {
  program
    .command('resolve-deps')
    .description('Compute dependency tree and materialization order')
    .option('--changed', 'Only changed nodes (graph newer than code)')
    .option('--node <path>', 'Specific node and its dependencies')
    .option('--format <format>', 'Output format: text or json', 'text')
    .action(async (options: { changed?: boolean; node?: string; format?: string }) => {
      try {
        const graph = await loadGraph(process.cwd());
        const mode = options.node ? 'node' : options.changed ? 'changed' : 'all';

        const stages = await resolveDeps(graph, {
          mode,
          nodePath: options.node,
        });

        if (options.format === 'json') {
          process.stdout.write(JSON.stringify({ stages }, null, 2));
        } else {
          for (const stage of stages) {
            const par = stage.parallel ? ' (parallel)' : '';
            process.stdout.write(`Stage ${stage.stage}${par}:\n`);
            for (const n of stage.nodes) {
              process.stdout.write(`  - ${n}\n`);
            }
            process.stdout.write('\n');
          }
        }
      } catch (error) {
        const msg = (error as Error).message;
        process.stderr.write(`Error: ${msg}\n`);
        if (msg.includes('Circular')) process.exit(1);
        if (msg.includes('not found')) process.exit(2);
        process.exit(1);
      }
    });
}
