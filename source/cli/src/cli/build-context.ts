import { Command } from 'commander';
import chalk from 'chalk';
import { loadGraph } from '../core/graph-loader.js';
import { buildContext } from '../core/context-builder.js';
import { formatContextMarkdown } from '../formatters/markdown.js';
import { formatContextJson } from '../formatters/json.js';

export function registerBuildContextCommand(program: Command): void {
  program
    .command('build-context <node-path>')
    .description('Build a complete context package for a node')
    .option('--format <format>', 'Output format: markdown or json', 'markdown')
    .action(async (nodePath: string, options: { format: string }) => {
      try {
        const graph = await loadGraph(process.cwd());
        const pkg = await buildContext(graph, nodePath);

        const threshold = graph.config.limits?.context_warning_tokens ?? 8000;
        if (pkg.tokenCount > threshold) {
          process.stderr.write(
            chalk.yellow(
              `⚠ Context for ${nodePath} is ${pkg.tokenCount.toLocaleString()} tokens (threshold: ${threshold.toLocaleString()}).\n` +
                `  Consider splitting the node or reducing relations.\n`,
            ),
          );
        }

        const output =
          options.format === 'json' ? formatContextJson(pkg) : formatContextMarkdown(pkg);

        process.stdout.write(output);
      } catch (error) {
        const msg = (error as Error).message;
        process.stderr.write(`Error: ${msg}\n`);

        if (msg.includes('Broken relation')) process.exit(2);
        if (msg.includes('Node not found')) process.exit(1);
        process.exit(1);
      }
    });
}
