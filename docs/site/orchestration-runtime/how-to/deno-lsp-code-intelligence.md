---
layout: layouts/base.vto
title: Deno LSP code intelligence in Claude Code
templateEngine: [vento, md]
order: 109
oldUrl: /how-to/deno-lsp-code-intelligence/
---

# Deno LSP code intelligence in Claude Code

This recipe gives every Claude Code session the same Deno language-server features for NetScript
apps: go-to-definition, find-references, hover, document symbols and live diagnostics, across the
CLI, VS Code and Zed. It combines the Claude Code LSP tool, the Deno LSP and a skills-directory
plugin install, so every new session loads the same `.lsp.json` configuration.

## Prerequisites

On each device you need:

- **Deno 2.9 or newer**, with `deno` on the path for both terminal and GUI launches. Check with
  `deno --version`.
- **Claude Code** (CLI, VS Code or Zed). Every surface should launch the same `claude` binary and
  read the same `~/.claude` directory.
- **The LSP tool flag** `ENABLE_LSP_TOOL=1`, set globally in Claude settings and as a real user
  environment variable.

## Step 1 — Install the Deno LSP plugin

Install the plugin into the Claude skills directory so it auto-loads in every session:

```bash
git clone https://github.com/wyattjoh/deno-lsp-claude-plugin ~/.claude/skills/deno-lsp
```

Claude Code auto-loads plugins installed under `~/.claude/skills/<name>/` as `<name>@skills-dir`,
so this install appears as `deno-lsp@skills-dir` on every surface and device. The cloned plugin
ships:

- `.claude-plugin/plugin.json` with the plugin name `claude-deno-lsp`.
- `.lsp.json` that starts `deno lsp`, maps the Deno/JavaScript extensions, and enables unstable
  language-server support.

The bundled `.lsp.json` is the shape NetScript expects. Keep it in the skills-directory plugin;
don't commit a live `.lsp.json` to a NetScript app to make Claude Code work:

{{ comp.codeBlock({ filename: "~/.claude/skills/deno-lsp/.lsp.json", lang: "json", code: "{\n  \"command\": \"deno\",\n  \"args\": [\"lsp\"],\n  \"extensions\": {\n    \".ts\": \"typescript\",\n    \".tsx\": \"typescriptreact\",\n    \".js\": \"javascript\",\n    \".jsx\": \"javascriptreact\",\n    \".mts\": \"typescript\",\n    \".cts\": \"typescript\",\n    \".mjs\": \"javascript\",\n    \".cjs\": \"javascript\"\n  },\n  \"unstable\": true\n}\n" }) }}

## Step 2 — Enable the Claude Code LSP tool globally

Add the LSP tool flag to `~/.claude/settings.json`. If the file already has an `env` object, merge
the key instead of replacing the rest of your settings:

{{ comp.codeBlock({ filename: "~/.claude/settings.json", lang: "json", code: "{\n  \"env\": {\n    \"ENABLE_LSP_TOOL\": \"1\"\n  }\n}\n" }) }}

Also set the same value as a real user environment variable, so terminal and GUI-launched Claude
Code processes inherit it.

On Windows:

```powershell
[Environment]::SetEnvironmentVariable('ENABLE_LSP_TOOL','1','User')
```

On macOS and Linux, put this in your shell profile:

```bash
export ENABLE_LSP_TOOL=1
```

## Step 3 — Confirm Deno is on PATH

The plugin runs `deno lsp`, so the `deno` executable must resolve from the environment that launches
Claude Code:

```bash
deno --version
```

## Step 4 — Restart Claude Code completely

Close and reopen Claude Code after installing the plugin or changing the environment.
`/reload-plugins` isn't enough: the language server and environment need a full process restart.

After the restart, open a NetScript app file and use the language features:

- Go to definition on a NetScript import or local symbol.
- Find references for a handler, component, or builder.
- Hover a `@netscript/fresh` or Preact symbol.
- Open document symbols for a route, island, service, or task file.
- Read live Deno diagnostics before running the slower project check.

## CLI, VS Code, and Zed notes

The global skills-directory install is the portable path:

| Surface | Install | Notes |
| --- | --- | --- |
| CLI | Global or one-off | The global `~/.claude/skills/deno-lsp` install is enough. `claude --plugin-dir <path>` also works for one CLI launch. |
| VS Code | Global only | VS Code launches the same `claude` binary and reads `~/.claude`. The CLI-only `--plugin-dir` doesn't apply. |
| Zed | ACP over `PATH` | Zed 0.202.5 and newer run Claude Code through ACP over the `$PATH` binary. Set `CLAUDE_CODE_EXECUTABLE` if Zed can't find it, for example when the binary lives inside WSL. |

For VS Code and Zed, prefer the skills-directory install over a one-off CLI flag, so editor and
terminal sessions share the same plugin and Deno LSP settings.

{{ comp callout { type: "warning", title: "Root Claude where the code lives" } }}
Claude's LSP config discovery is scoped to the workspace root it starts with, which becomes the language server's cwd and rootUri. Files opened from a sibling git worktree outside that root are treated as detached files: the Deno LSP doesn't see the app's <code>deno.json</code>, so Fresh and Preact files show false positives such as <code>document</code> or <code>useState</code> inferred as <code>any</code>, or <code>This JSX tag requires 'React' to be in scope</code>.
{{ /comp }}

Launch Claude Code with the repository or worktree as the root, or add the worktree directory to
the session:

```bash
claude --continue --add-dir "<worktree-abs-path>"
```

For Fresh and Preact apps, the app-level `deno.json` must be inside the discovered scope so the LSP
sees `jsx: "precompile"`, `jsxImportSource: "preact"` and the DOM libraries. When LSP diagnostics
look wrong inside a worktree, trust `deno task check`; it is the project's source of truth.

## Quick verification

Run these checks after the restart:

```bash
which deno
deno --version
echo "$ENABLE_LSP_TOOL"
```

Then open a file under the NetScript app root and confirm that hover, definition lookup, document
symbols and live diagnostics work in the same Claude Code session. If the diagnostics disagree with
the project check, root the session at the app or worktree and run:

```bash
deno task check
```

That command is the final verdict for the workspace.

## Next step

Give the agent NetScript's own diagnostics and documentation too, with
{{ comp.xref({ key: "cap:agent-tooling", text: "Agent tooling" }) }}.
