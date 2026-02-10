#!/usr/bin/env node
import { Command } from 'commander';
import { registerInitCommand } from './cli/init.js';
import { registerBuildContextCommand } from './cli/build-context.js';
import { registerResolveDepsCommand } from './cli/resolve-deps.js';
import { registerCheckCommand } from './cli/check.js';
import { registerDriftCommand } from './cli/drift.js';
import { registerStatusCommand } from './cli/status.js';
import { registerAffectedCommand } from './cli/affected.js';
import { registerTreeCommand } from './cli/tree.js';

const program = new Command();

program
  .name('ygg')
  .description('Yggdrasil — Graph-Driven Software Development CLI')
  .version('0.1.0');

registerInitCommand(program);
registerBuildContextCommand(program);
registerResolveDepsCommand(program);
registerCheckCommand(program);
registerDriftCommand(program);
registerStatusCommand(program);
registerAffectedCommand(program);
registerTreeCommand(program);

program.parse();
