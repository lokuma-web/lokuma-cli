import { execSync } from 'node:child_process';
import chalk from 'chalk';
import type { AIType } from '../types/index.js';
import { initCommand } from './init.js';

interface UpdateOptions {
  ai?: AIType;
}

export async function updateCommand(options: UpdateOptions = {}): Promise<void> {
  console.log();
  console.log(chalk.bold('  Lokuma — Update'));
  console.log(chalk.dim('  Updating @lokuma/cli to the latest version...'));
  console.log();

  try {
    execSync('npm install -g @lokuma/cli', { stdio: 'inherit' });
    console.log();
    console.log(chalk.green('  ✓  Updated @lokuma/cli successfully'));

    if (options.ai && options.ai !== 'all') {
      console.log();
      console.log(chalk.dim(`  Refreshing installed skill for ${options.ai}...`));
      await initCommand({ ai: options.ai, force: true });
    } else if (options.ai === 'all') {
      console.log();
      console.log(chalk.dim('  Refreshing installed skills for all assistants...'));
      await initCommand({ ai: 'all', force: true });
    }

    console.log();
    console.log(chalk.dim('  Tip: restart your AI assistant to load the new SKILL.md.'));
    console.log();
  } catch (error) {
    console.log();
    console.error(chalk.red('  ✗  Failed to update @lokuma/cli.'));
    console.error(chalk.dim('  Try running manually: npm install -g @lokuma/cli'));
    console.log();
    process.exit(1);
  }
}
