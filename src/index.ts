#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initCommand } from './commands/init.js';
import { authLoginCommand } from './commands/auth.js';
import { updateCommand } from './commands/update.js';
import type { AIType } from './types/index.js';
import { AI_TYPES } from './types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const program = new Command();

program
  .name('lokuma')
  .description('Install Lokuma design intelligence skill for AI coding assistants')
  .version(pkg.version);

program
  .command('init')
  .description('Install Lokuma skill to current project')
  .option('-a, --ai <type>', `AI assistant type (${AI_TYPES.join(', ')})`)
  .option('-f, --force', 'Overwrite existing files')
  .action(async (options) => {
    if (options.ai && !AI_TYPES.includes(options.ai as AIType)) {
      console.error(`Invalid AI type: ${options.ai}`);
      console.error(`Valid types: ${AI_TYPES.join(', ')}`);
      process.exit(1);
    }
    await initCommand({
      ai: options.ai as AIType | undefined,
      force: options.force,
    });
  });

// auth subcommand group
const auth = program.command('auth').description('Manage authentication');

auth
  .command('login')
  .description('Set or update your Lokuma API key')
  .action(async () => {
    await authLoginCommand();
  });

program
  .command('update')
  .description('Update lokuma-cli to the latest version from npm')
  .option('-a, --ai <type>', `Also refresh the installed skill for a specific AI assistant after updating (${AI_TYPES.join(', ')})`)
  .action(async (options) => {
    if (options.ai && !AI_TYPES.includes(options.ai as AIType)) {
      console.error(`Invalid AI type: ${options.ai}`);
      console.error(`Valid types: ${AI_TYPES.join(', ')}`);
      process.exit(1);
    }
    await updateCommand({ ai: options.ai as AIType | undefined });
  });

program.parse();
