# Research — #1247 editor-aware agent init

## Issue-first findings

- `netscript init --editor` is the only caller of `generateEditorConfigFiles`; no existing-project
  path exists.
- `netscript agent init` models Claude/VS Code as agent hosts and unconditionally falls back to both
  when nothing is detected. It has no editor input and no Zed adapter.
- VS Code MCP is written to `.vscode/mcp.json` under `servers`.
- Zed's current official configuration uses project `.zed/settings.json` under `context_servers`;
  local entries take `command`, `args`, and optional `env`. Project trust gates execution.
- The existing editor generator already owns Zed/VS Code LSP, task, debug, and schema files and can
  be reused for post-clone application.

## Contract

- Preserve `--host claude|vscode|all` for compatibility and Claude skill installation.
- Add `--editor none|zed|vscode`, sharing the scaffold `EditorChoice` vocabulary.
- When omitted, infer a single existing `.zed` or `.vscode` choice; reject ambiguous dual-editor
  projects with an explicit `--editor` remedy. With neither present, select `none` rather than
  silently creating VS Code configuration.
- Applying an editor writes the existing editor setup plus its native MCP configuration,
  idempotently and without clobbering unrelated settings.
