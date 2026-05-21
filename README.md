# lokuma-cli

Install [Lokuma](https://lokuma.io) design intelligence skill for AI coding assistants.

## Quick Start

```bash
npx lokuma-cli init --ai claude
```

Already installed and just want the latest CLI?

```bash
lokuma update
```

Update the CLI and refresh an installed skill in one step:

```bash
lokuma update --ai openclaw
```

## Supported AI Assistants

| Flag | Assistant |
|------|-----------|
| `--ai claude` | Claude Code |
| `--ai cursor` | Cursor |
| `--ai windsurf` | Windsurf |
| `--ai copilot` | GitHub Copilot |
| `--ai kiro` | Kiro |
| `--ai roocode` | Roo Code |
| `--ai codex` | Codex CLI |
| `--ai qoder` | Qoder |
| `--ai gemini` | Gemini CLI |
| `--ai trae` | Trae |
| `--ai opencode` | OpenCode |
| `--ai continue` | Continue |
| `--ai codebuddy` | CodeBuddy |
| `--ai droid` | Droid (Factory) |
| `--ai all` | All assistants |

## Configuration

After installing, set your API key:

```bash
export LOKUMA_API_KEY=lokuma_your_key_here
```

Get your API key at [lokuma.io](https://lokuma.io).

## Options

```
lokuma init [options]
lokuma update

Options:
  -a, --ai <type>   AI assistant type
  -f, --force       Overwrite existing files
  -h, --help        Show help
  -V, --version     Show version
```

## How It Works

`lokuma-cli` installs two files into your project:

1. **SKILL.md** — tells your AI assistant how to use Lokuma
2. **design.py** — a lightweight cloud client that calls the Lokuma API

No local data files. No Python dependencies. Just set your API key and go.

## License

MIT
