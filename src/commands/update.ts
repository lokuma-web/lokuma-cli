import { execSync } from 'node:child_process';
import chalk from 'chalk';
import type { AIType } from '../types/index.js';
import { initCommand } from './init.js';

interface UpdateOptions {
  ai?: AIType;
}

// V2 TRIAL: not on npm — installed via the curl one-liner from GitHub raw.
// `update` re-runs the same installer (pulls latest design.py + reinstalls
// any IDE skills the user previously set up).
const INSTALLER_URL =
  'https://raw.githubusercontent.com/Mumu090909/lokuma-da-v2-trial/main/installer/install-v2-trial.sh';

export async function updateCommand(options: UpdateOptions = {}): Promise<void> {
  console.log();
  console.log(chalk.bold('  Lokuma DA V2 (Trial) — Update'));
  console.log(chalk.dim('  Re-running installer to pull the latest design.py + SKILL.md...'));
  console.log();

  try {
    // Pipe curl into bash — non-interactive (-y won't prompt for new key,
    // existing config is preserved).
    execSync(`curl -fsSL ${INSTALLER_URL} | bash`, {
      stdio: 'inherit',
      env: { ...process.env, LOKUMA_V2_TRIAL_NONINTERACTIVE: '1' },
    });
    console.log();
    console.log(chalk.green('  ✓  Updated successfully'));

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
    console.error(chalk.red('  ✗  Failed to update lokuma-v2-trial.'));
    console.error(chalk.dim(`  Try running manually: curl -fsSL ${INSTALLER_URL} | bash`));
    console.log();
    process.exit(1);
  }
}
