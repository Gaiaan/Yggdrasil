import { Command } from 'commander';
import { loadGraph } from '../core/graph-loader.js';
import { detectDrift } from '../core/drift-detector.js';
import chalk from 'chalk';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Show graph summary')
    .option('--format <format>', 'Output format: text or json', 'text')
    .action(async (options: { format: string }) => {
      try {
        const graph = await loadGraph(process.cwd());

        // Count nodes by type
        const typeCounts = new Map<string, number>();
        let mappedCount = 0;
        let blackboxCount = 0;

        for (const node of graph.nodes.values()) {
          typeCounts.set(node.meta.type, (typeCounts.get(node.meta.type) ?? 0) + 1);
          if (node.meta.mapping) mappedCount++;
          if (node.meta.blackbox) blackboxCount++;
        }

        // Count relations
        let relationCount = 0;
        for (const node of graph.nodes.values()) {
          relationCount += node.meta.relations?.length ?? 0;
        }

        // Count tags in use
        const usedTags = new Set<string>();
        for (const node of graph.nodes.values()) {
          for (const tag of node.meta.tags ?? []) usedTags.add(tag);
        }

        // Drift summary
        const drift = await detectDrift(graph);
        const okCount = drift.entries.filter((e) => e.status === 'ok').length;
        const driftCount = drift.driftCount;
        const unmaterialized = drift.entries.filter((e) => e.status === 'unmaterialized').length;

        if (options.format === 'json') {
          const typeCountsObj = Object.fromEntries(typeCounts);
          const output = {
            graph: graph.config.name,
            stack: graph.config.stack ?? {},
            nodes: {
              total: graph.nodes.size,
              byType: typeCountsObj,
              blackbox: blackboxCount,
              mapped: mappedCount,
            },
            tags: {
              defined: Object.keys(graph.config.tags ?? {}).length,
              inUse: usedTags.size,
            },
            aspects: graph.aspects.length,
            flows: graph.flows.length,
            relations: relationCount,
            drift: {
              upToDate: okCount,
              drift: driftCount,
              unmaterialized,
            },
          };
          process.stdout.write(JSON.stringify(output, null, 2));
          return;
        }

        // Text output
        process.stdout.write(`Graph: ${graph.config.name}\n`);
        const stackEntries = Object.entries(graph.config.stack ?? {});
        if (stackEntries.length > 0) {
          process.stdout.write(`Stack: ${stackEntries.map(([, v]) => v).join(' / ')}\n`);
        }
        process.stdout.write('\n');

        const typeStr = [...typeCounts.entries()].map(([t, c]) => `${c} ${t}s`).join(', ');
        process.stdout.write(`Nodes:      ${graph.nodes.size} total (${typeStr})\n`);
        if (blackboxCount > 0) {
          process.stdout.write(`            ${blackboxCount} blackbox\n`);
        }
        process.stdout.write(
          `Tags:       ${Object.keys(graph.config.tags ?? {}).length} defined, ${usedTags.size} in use\n`,
        );
        process.stdout.write(`Aspects:    ${graph.aspects.length} defined\n`);
        process.stdout.write(`Flows:      ${graph.flows.length} defined\n`);
        process.stdout.write(`Relations:  ${relationCount} total\n`);
        process.stdout.write(`Mappings:   ${mappedCount} nodes mapped to code\n`);

        process.stdout.write('\nDrift:\n');
        if (okCount > 0) process.stdout.write(chalk.green(`  ✓ ${okCount} up to date\n`));
        if (driftCount > 0) process.stdout.write(chalk.red(`  ✗ ${driftCount} nodes have drift\n`));
        if (unmaterialized > 0)
          process.stdout.write(chalk.dim(`  - ${unmaterialized} unmaterialized\n`));
      } catch (error) {
        process.stderr.write(`Error: ${(error as Error).message}\n`);
        process.exit(1);
      }
    });
}
