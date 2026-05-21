import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { createInterface } from 'node:readline';
import chalk from 'chalk';
import { AI_SKILL_PATHS, AI_TYPES } from '../types/index.js';

// Lokuma auth — stores API key in ~/.lokuma/config.json
const CONFIG_DIR_NAME = '.lokuma';
const CONFIG_FILE_NAME = 'config.json';
const ENV_VAR_NAME = 'LOKUMA_API_KEY';
const KEY_PREFIX = 'lokuma_';
const DEFAULT_API_URL = 'https://api.lokuma.ai';

// ── Resolve ~ paths ───────────────────────────────────────────────────────────
function resolvePath(p: string): string {
  if (p.startsWith('~/')) return join(homedir(), p.slice(2));
  return p;
}

// ── Update LOKUMA_API_KEY line in an existing SKILL.md ──────────────────────
function updateSkillMdKey(skillMdPath: string, key: string): boolean {
  if (!existsSync(skillMdPath)) return false;
  let content = readFileSync(skillMdPath, 'utf-8');
  // Match either old V1 line or V2 trial line at start of file
  if (/^LOKUMA(_V2_TRIAL)?_API_KEY = /.test(content)) {
    content = content.replace(
      /^LOKUMA(_V2_TRIAL)?_API_KEY = .+\n\n?/,
      `${ENV_VAR_NAME} = ${key}\n\n`,
    );
  } else {
    content = `${ENV_VAR_NAME} = ${key}\n\n` + content;
  }
  writeFileSync(skillMdPath, content, 'utf-8');
  return true;
}

// ── Update all installed SKILL.md files ───────────────────────────────────────
function updateAllSkillMds(key: string): string[] {
  const updated: string[] = [];
  for (const t of AI_TYPES.filter(t => t !== 'all') as Exclude<typeof AI_TYPES[number], 'all'>[]) {
    const p = resolvePath(AI_SKILL_PATHS[t].skillMd);
    if (updateSkillMdKey(p, key)) updated.push(p);
  }
  return updated;
}

// ── Persist key to ~/.lokuma/config.json ──────────────────────────────────────
function persistKey(key: string): string {
  const configDir = join(homedir(), CONFIG_DIR_NAME);
  const configFile = join(configDir, CONFIG_FILE_NAME);
  mkdirSync(configDir, { recursive: true });

  // Preserve apiBase / apiVersion if config already exists
  let existing: Record<string, unknown> = {};
  if (existsSync(configFile)) {
    try { existing = JSON.parse(readFileSync(configFile, 'utf-8')); } catch { /* ignore */ }
  }
  const merged = {
    ...existing,
    apiKey: key,
    apiBase: existing.apiBase ?? DEFAULT_API_URL,
  };
  writeFileSync(configFile, JSON.stringify(merged, null, 2) + '\n', { mode: 0o600 });
  return configFile;
}

// ── Prompt helper ─────────────────────────────────────────────────────────────
const EOT = String.fromCharCode(4);     // Ctrl-D
const ETX = String.fromCharCode(3);     // Ctrl-C
const DEL = String.fromCharCode(127);   // backspace

async function prompt(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: hidden ? undefined : process.stdout,
      terminal: hidden,
    });

    if (hidden) {
      process.stdout.write(question);
      process.stdin.setRawMode?.(true);
      let input = '';
      process.stdin.resume();
      process.stdin.setEncoding('utf-8');
      process.stdin.on('data', (char: string) => {
        if (char === '\n' || char === '\r' || char === EOT) {
          process.stdin.setRawMode?.(false);
          process.stdout.write('\n');
          rl.close();
          resolve(input);
        } else if (char === ETX) {
          process.exit(0);
        } else if (char === DEL) {
          input = input.slice(0, -1);
        } else {
          input += char;
        }
      });
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

// ── Auth login command ────────────────────────────────────────────────────────
export async function authLoginCommand(): Promise<void> {
  console.log();
  console.log(chalk.bold('  Lokuma — API Key Setup'));
  console.log(chalk.dim('  Get a key at https://agent.lokuma.ai'));
  console.log();

  // Check if already set
  const existing = process.env[ENV_VAR_NAME];
  if (existing) {
    const masked = existing.slice(0, 18) + '••••••••••••••••••••••';
    console.log(chalk.dim(`  Current key (from env): ${masked}`));
    const overwrite = await prompt('  Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log(chalk.dim('  Keeping existing key.'));
      console.log();
      return;
    }
  }

  const key = await prompt('  Paste your Lokuma API key: ', true);

  if (!key) {
    console.log(chalk.yellow('  No key entered. Exiting.'));
    console.log();
    return;
  }

  if (!key.startsWith(KEY_PREFIX)) {
    console.log(chalk.red(`  ✗  Invalid key format (should start with '${KEY_PREFIX}')`));
    console.log(chalk.dim('  Get a key at https://agent.lokuma.ai'));
    console.log();
    process.exit(1);
  }

  const cfg = persistKey(key);

  // Update all installed SKILL.md files
  const updated = updateAllSkillMds(key);

  console.log();
  console.log(chalk.green('  ✓  API key saved!'));
  console.log(chalk.dim(`  Written to: ${cfg}`));
  if (updated.length > 0) {
    console.log(chalk.dim(`  Updated ${updated.length} SKILL.md file(s) with new key.`));
  }
  console.log();
  console.log(chalk.dim('  To use immediately in this shell:'));
  console.log(chalk.cyan(`  export ${ENV_VAR_NAME}=${key.slice(0, 18)}...`));
  console.log();
  console.log(chalk.dim('  (Restart your AI assistant for the SKILL.md changes to take effect.)'));
  console.log();
}
