import { Command } from 'commander';
import chalk from 'chalk';
import { loadGraph } from '../core/graph-loader.js';
import { detectDrift, absorbDrift } from '../core/drift-detector.js';

export function registerDriftCommand(program: Command): void {
  program
    .command('drift')
    .description('Detect divergence between graph and code')
    .option('--node <path>', 'Check specific node only')
    .option('--absorb <path>', 'Absorb drift for a node (update .drift-state)')
    .option('--format <format>', 'Output format: text or json', 'text')
    .action(async (options: { node?: string; absorb?: string; format: string }) => {
      try {
        const graph = await loadGraph(process.cwd());

        // Handle --absorb
        if (options.absorb) {
          await absorbDrift(graph, options.absorb);
          process.stdout.write(`Drift absorbed for ${options.absorb}\n`);
          process.exit(0);
        }

        // Normal drift detection
        const report = await detectDrift(graph, options.node);

        if (options.format === 'json') {
          process.stdout.write(JSON.stringify(report, null, 2));
        } else {
          for (const entry of report.entries) {
            const paths = entry.mappingPaths.join(', ');
            process.stdout.write(`${entry.nodePath} → ${paths}\n`);

            switch (entry.status) {
              case 'ok':
                process.stdout.write(chalk.green('  ✓ OK: matches last materialization\n'));
                break;
              case 'drift':
                process.stdout.write(chalk.red(`  ✗ DRIFT: ${entry.details}\n`));
                break;
              case 'missing':
                process.stdout.write(chalk.yellow(`  ✗ MISSING: ${entry.details}\n`));
                break;
              case 'unmaterialized':
                process.stdout.write(chalk.dim(`  - UNMATERIALIZED: ${entry.details}\n`));
                break;
            }
            process.stdout.write('\n');
          }
          process.stdout.write(
            `${report.totalChecked} nodes checked. ` +
              `${report.driftCount} drift, ${report.missingCount} missing.\n`,
          );
        }

        // Exit codes
        if (report.driftCount > 0) process.exit(1);
        if (report.missingCount > 0) process.exit(2);
        process.exit(0);
      } catch (error) {
        process.stderr.write(`Error: ${(error as Error).message}\n`);
        process.exit(1);
      }
    });
}
