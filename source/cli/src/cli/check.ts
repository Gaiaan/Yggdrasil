import { Command } from 'commander';
import chalk from 'chalk';
import { loadGraph } from '../core/graph-loader.js';
import { validate } from '../core/validator.js';

export function registerCheckCommand(program: Command): void {
  program
    .command('check')
    .description('Validate graph consistency')
    .option('--format <format>', 'Output format: text or json', 'text')
    .action(async (options: { format: string }) => {
      try {
        const graph = await loadGraph(process.cwd());
        const result = await validate(graph);

        if (options.format === 'json') {
          process.stdout.write(JSON.stringify(result, null, 2));
        } else {
          process.stdout.write(`${result.nodesScanned} nodes scanned\n\n`);
          const errors = result.issues.filter((i) => i.severity === 'error');
          const warnings = result.issues.filter((i) => i.severity === 'warning');
          for (const issue of errors) {
            const loc = issue.nodePath ? ` (${issue.nodePath})` : '';
            process.stdout.write(chalk.red(`✗ ${issue.rule}${loc}: ${issue.message}\n`));
          }
          for (const issue of warnings) {
            const loc = issue.nodePath ? ` (${issue.nodePath})` : '';
            process.stdout.write(chalk.yellow(`⚠ ${issue.rule}${loc}: ${issue.message}\n`));
          }
          if (errors.length === 0 && warnings.length === 0) {
            process.stdout.write(chalk.green('✓ No issues found.\n'));
          } else {
            process.stdout.write(`\n${errors.length} errors, ${warnings.length} warnings.\n`);
          }
        }

        const hasErrors = result.issues.some((i) => i.severity === 'error');
        process.exit(hasErrors ? 1 : 0);
      } catch (error) {
        process.stderr.write(`Error: ${(error as Error).message}\n`);
        process.exit(1);
      }
    });
}
