export type AIType =
  | 'claude' | 'cursor' | 'windsurf' | 'copilot' | 'kiro'
  | 'roocode' | 'codex' | 'qoder' | 'gemini' | 'trae'
  | 'opencode' | 'continue' | 'codebuddy' | 'droid' | 'openclaw' | 'all';

export const AI_TYPES: AIType[] = [
  'claude', 'cursor', 'windsurf', 'copilot', 'kiro',
  'roocode', 'codex', 'qoder', 'gemini', 'trae',
  'opencode', 'continue', 'codebuddy', 'droid', 'openclaw', 'all',
];

export const AI_DISPLAY_NAMES: Record<AIType, string> = {
  claude:    'Claude Code',
  cursor:    'Cursor',
  windsurf:  'Windsurf',
  copilot:   'GitHub Copilot',
  kiro:      'Kiro',
  roocode:   'Roo Code',
  codex:     'Codex CLI',
  qoder:     'Qoder',
  gemini:    'Gemini CLI',
  trae:      'Trae',
  opencode:  'OpenCode',
  continue:  'Continue',
  codebuddy: 'CodeBuddy',
  droid:     'Droid (Factory)',
  openclaw:  'OpenClaw',
  all:       'All assistants',
};

export interface SkillPaths {
  root: string;
  skillMd: string;
  scriptPy: string;
}

// Skill subdir name = `lokuma` in every IDE.
export const AI_SKILL_PATHS: Record<Exclude<AIType, 'all'>, SkillPaths> = {
  claude:    { root: '~/.claude/skills/lokuma',    skillMd: '~/.claude/skills/lokuma/SKILL.md',    scriptPy: '~/.claude/skills/lokuma/scripts/design.py'    },
  cursor:    { root: '~/.cursor/skills/lokuma',    skillMd: '~/.cursor/skills/lokuma/SKILL.md',    scriptPy: '~/.cursor/skills/lokuma/scripts/design.py'    },
  windsurf:  { root: '~/.windsurf/skills/lokuma',  skillMd: '~/.windsurf/skills/lokuma/SKILL.md',  scriptPy: '~/.windsurf/skills/lokuma/scripts/design.py'  },
  copilot:   { root: '~/.github/skills/lokuma',    skillMd: '~/.github/skills/lokuma/SKILL.md',    scriptPy: '~/.github/skills/lokuma/scripts/design.py'    },
  kiro:      { root: '~/.kiro/skills/lokuma',      skillMd: '~/.kiro/skills/lokuma/SKILL.md',      scriptPy: '~/.kiro/skills/lokuma/scripts/design.py'      },
  roocode:   { root: '~/.roo/skills/lokuma',       skillMd: '~/.roo/skills/lokuma/SKILL.md',       scriptPy: '~/.roo/skills/lokuma/scripts/design.py'       },
  codex:     { root: '~/.codex/skills/lokuma',     skillMd: '~/.codex/skills/lokuma/SKILL.md',     scriptPy: '~/.codex/skills/lokuma/scripts/design.py'     },
  qoder:     { root: '~/.qoder/skills/lokuma',     skillMd: '~/.qoder/skills/lokuma/SKILL.md',     scriptPy: '~/.qoder/skills/lokuma/scripts/design.py'     },
  gemini:    { root: '~/.gemini/skills/lokuma',    skillMd: '~/.gemini/skills/lokuma/SKILL.md',    scriptPy: '~/.gemini/skills/lokuma/scripts/design.py'    },
  trae:      { root: '~/.trae/skills/lokuma',      skillMd: '~/.trae/skills/lokuma/SKILL.md',      scriptPy: '~/.trae/skills/lokuma/scripts/design.py'      },
  opencode:  { root: '~/.opencode/skills/lokuma',  skillMd: '~/.opencode/skills/lokuma/SKILL.md',  scriptPy: '~/.opencode/skills/lokuma/scripts/design.py'  },
  continue:  { root: '~/.continue/skills/lokuma',  skillMd: '~/.continue/skills/lokuma/SKILL.md',  scriptPy: '~/.continue/skills/lokuma/scripts/design.py'  },
  codebuddy: { root: '~/.codebuddy/skills/lokuma', skillMd: '~/.codebuddy/skills/lokuma/SKILL.md', scriptPy: '~/.codebuddy/skills/lokuma/scripts/design.py' },
  droid:     { root: '~/.factory/skills/lokuma',   skillMd: '~/.factory/skills/lokuma/SKILL.md',   scriptPy: '~/.factory/skills/lokuma/scripts/design.py'   },
  openclaw:  { root: '~/.openclaw/workspace/skills/lokuma', skillMd: '~/.openclaw/workspace/skills/lokuma/SKILL.md', scriptPy: '~/.openclaw/workspace/skills/lokuma/scripts/design.py' },
};
