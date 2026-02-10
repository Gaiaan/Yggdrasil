import { Command } from 'commander';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { installClaude } from '../templates/adapters/claude.js';
import { installCursor } from '../templates/adapters/cursor.js';
import { installCopilot } from '../templates/adapters/copilot.js';
import { installGemini } from '../templates/adapters/gemini.js';
import { getPackageRoot } from '../utils/paths.js';

const INSTALLERS: Record<
  string,
  (templatesDir: string, projectRoot: string) => Promise<void>
> = {
  claude: installClaude,
  cursor: installCursor,
  copilot: installCopilot,
  gemini: installGemini,
};

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize Yggdrasil graph in current project')
    .option('--agent <name>', 'Target agent: claude, cursor, copilot, gemini')
    .option(
      '--commands-only',
      'Only install or update agent commands; do not touch config.yaml or directory structure',
    )
    .action(async (options: { agent?: string; commandsOnly?: boolean }) => {
      const projectRoot = process.cwd();
      const yggRoot = path.join(projectRoot, '.yggdrasil');

      if (options.commandsOnly) {
        if (!options.agent) {
          process.stderr.write(
            'Error: --commands-only requires --agent. Example: ygg init --agent cursor --commands-only\n',
          );
          process.exit(1);
        }
        const installer = INSTALLERS[options.agent];
        if (!installer) {
          process.stderr.write(
            `Unknown agent: ${options.agent}. Use: ${Object.keys(INSTALLERS).join(', ')}\n`,
          );
          process.exit(1);
        }
        const packageRoot = getPackageRoot();
        const templatesDir = path.join(packageRoot, 'templates', 'commands');
        await installer(templatesDir, projectRoot);
        const agentDirs: Record<string, string> = {
          claude: '.claude/commands',
          cursor: '.cursor/commands',
          copilot: '.github/agents',
          gemini: '.gemini/commands',
        };
        process.stdout.write(
          `✓ Agent commands updated in ${agentDirs[options.agent]}/\n`,
        );
        return;
      }

      // 1. Create directory structure
      await mkdir(path.join(yggRoot, 'aspects'), { recursive: true });
      await mkdir(path.join(yggRoot, 'flows'), { recursive: true });
      await mkdir(path.join(yggRoot, '.briefs'), { recursive: true });

      // 2. Create skeleton config.yaml
      const configContent = `name: "My Project"

stack:
  language: ""
  runtime: ""
  framework: ""

standards:
  coding: ""
  testing: ""

limits:
  context_warning_tokens: 8000

tags: {}
`;
      await writeFile(path.join(yggRoot, 'config.yaml'), configContent);

      // 3. Copy agent command templates via adapter
      const agentName = options.agent;
      if (agentName) {
        const installer = INSTALLERS[agentName];
        if (!installer) {
          process.stderr.write(
            `Unknown agent: ${agentName}. Use: ${Object.keys(INSTALLERS).join(', ')}\n`,
          );
          process.exit(1);
        }
        // Resolve templates dir from package root (works for global install)
        const packageRoot = getPackageRoot();
        const templatesDir = path.join(packageRoot, 'templates', 'commands');
        await installer(templatesDir, projectRoot);
        const agentDirs: Record<string, string> = {
          claude: '.claude/commands',
          cursor: '.cursor/commands',
          copilot: '.github/agents',
          gemini: '.gemini/commands',
        };
        process.stdout.write(
          `✓ Agent commands installed to ${agentDirs[agentName]}/\n`,
        );
      } else {
        // If no --agent flag, list available agents
        process.stdout.write('No --agent specified. Available agents:\n');
        const agentDirs: Record<string, string> = {
          claude: '.claude/commands',
          cursor: '.cursor/commands',
          copilot: '.github/agents',
          gemini: '.gemini/commands',
        };
        for (const [name, dir] of Object.entries(agentDirs)) {
          process.stdout.write(`  --agent ${name}  →  ${dir}/\n`);
        }
        process.stdout.write('\nRun: ygg init --agent <name>\n');
      }

      // 4. Print next steps
      process.stdout.write('\n✓ Yggdrasil initialized.\n\n');
      process.stdout.write('Next steps:\n');
      process.stdout.write(
        '  1. Edit .yggdrasil/config.yaml — set your project name and tech stack\n',
      );
      process.stdout.write(
        '  2. Create your first node: mkdir .yggdrasil/my-module && create node.yaml\n',
      );
      process.stdout.write('  3. Run: ygg check\n');
    });
}
