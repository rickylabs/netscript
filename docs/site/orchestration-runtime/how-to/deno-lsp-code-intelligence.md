---
layout: layouts/base.vto
title: Deno LSP code intelligence in Claude Code
templateEngine: [vento, md]
order: 108
oldUrl: /how-to/deno-lsp-code-intelligence/
---

# Deno LSP code intelligence in Claude Code

**Goal:** give every Claude Code session the same Deno language-server features for NetScript apps:
go-to-definition, find-references, hover, document symbols, and live diagnostics across the CLI,
VS Code, and Zed.

This is the blessed setup for NetScript app work. It uses the Claude Code LSP tool, the Deno LSP,
and a skills-dir plugin install so every new session loads the same `.lsp.json` configuration.

## Prerequisites

{{ comp.apiTable({
  caption: "What each device needs",
  rows: [
    { name: "Deno", type: "2.9+", desc: "<code>deno</code> must be on PATH for terminal and GUI launches. Check with <code>deno --version</code>." },
    { name: "Claude Code", type: "CLI / VS Code / Zed", desc: "All surfaces should launch the same <code>claude</code> binary and read the same <code>~/.claude</code> directory." },
    { name: "LSP tool flag", type: "ENABLE_LSP_TOOL=1", desc: "Set globally in Claude settings and as a real user environment variable." }
  ]
}) }}

## Step 1 - Install the Deno LSP plugin

Install the plugin into the Claude skills directory so it auto-loads in every session:

```bash
git clone https://github.com/wyattjoh/deno-lsp-claude-plugin ~/.claude/skills/deno-lsp
```

Claude Code auto-loads plugins installed under `~/.claude/skills/<name>/` as
`<name>@skills-dir`, so this install appears as `deno-lsp@skills-dir` across harnesses and devices.
The cloned plugin ships:

- `.claude-plugin/plugin.json` with the plugin name `claude-deno-lsp`.
- `.lsp.json` that starts `deno lsp`, maps the Deno/JavaScript extensions, and enables unstable
  language-server support.

The bundled `.lsp.json` content is the shape NetScript expects. Keep it in the skills-dir plugin;
do not check a live `.lsp.json` into a NetScript app just to make Claude Code work:

```json
{
  "command": "deno",
  "args": ["lsp"],
  "extensions": {
    ".ts": "typescript",
    ".tsx": "typescriptreact",
    ".js": "javascript",
    ".jsx": "javascriptreact",
    ".mts": "typescript",
    ".cts": "typescript",
    ".mjs": "javascript",
    ".cjs": "javascript"
  },
  "unstable": true
}
```

## Step 2 - Enable the Claude Code LSP tool globally

Add the LSP tool flag to `~/.claude/settings.json`. If the file already has an `env` object, merge
the key rather than replacing the rest of your settings:

```json
{
  "env": {
    "ENABLE_LSP_TOOL": "1"
  }
}
```

Also set the same value as a real user environment variable so terminal and GUI-launched Claude Code
processes inherit it.

On Windows:

```powershell
[Environment]::SetEnvironmentVariable('ENABLE_LSP_TOOL','1','User')
```

On macOS and Linux, put this in your shell profile:

```bash
export ENABLE_LSP_TOOL=1
```

## Step 3 - Confirm Deno is on PATH

The plugin runs `deno lsp`, so the `deno` executable must resolve from the environment that launches
Claude Code:

```bash
deno --version
```

Use Deno 2.9 or newer for NetScript app work.

## Step 4 - Restart Claude Code completely

Close and reopen Claude Code after installing the plugin or changing the environment. `/reload-plugins`
is not enough for the LSP process; the language server and environment need a full process restart.

After restart, open a NetScript app file and use the language features directly:

- Go to definition on a NetScript import or local symbol.
- Find references for a handler, component, or builder.
- Hover a `@netscript/fresh` or Preact symbol.
- Open document symbols for a route, island, service, or task file.
- Read live Deno diagnostics before running the slower project check.

## CLI, VS Code, and Zed notes

The global skills-dir install is the portable path.

{{ comp.apiTable({
  caption: "Claude Code surface behavior",
  rows: [
    { name: "CLI", type: "global or one-off", desc: "The global <code>~/.claude/skills/deno-lsp</code> install is enough. <code>claude --plugin-dir &lt;path&gt;</code> also works for one CLI launch." },
    { name: "VS Code", type: "global only", desc: "VS Code launches the same <code>claude</code> binary and reads <code>~/.claude</code>. CLI-only <code>--plugin-dir</code> does not apply here." },
    { name: "Zed", type: "ACP over PATH", desc: "Zed 0.202.5 and newer run Claude Code through ACP over the <code>$PATH</code> binary. Set <code>CLAUDE_CODE_EXECUTABLE</code> if Zed cannot find it, such as when the binary lives inside WSL." }
  ]
}) }}

For VS Code and Zed, prefer the skills-dir install over a one-off CLI flag. That keeps editor
sessions, terminal sessions, and harness sessions on the same plugin and Deno LSP settings.

{{ comp callout { type: "warning", title: "Root Claude where the code lives" } }}
Claude's LSP config discovery is scoped to the workspace root it starts with, which becomes the
language server's cwd/rootUri. Files opened from a sibling git worktree outside that root are treated
as detached files: the Deno LSP does not see the app's <code>deno.json</code>, so Fresh and Preact
files can show false positives such as <code>document</code> or <code>useState</code> inferred as
<code>any</code>, or <code>This JSX tag requires 'React' to be in scope</code>.

That is expected LSP behavior. Launch Claude Code with the repository or worktree as the root, or
add the worktree directory to the session:

<pre><code>claude --continue --add-dir "&lt;worktree-abs-path&gt;"</code></pre>

For Fresh and Preact apps, the app-level <code>deno.json</code> must be inside the discovered scope
so the LSP sees <code>jsx: "precompile"</code>, <code>jsxImportSource: "preact"</code>, and the
DOM libraries. When LSP diagnostics look wrong inside a worktree, trust <code>deno task check</code>;
it is the project source of truth.
{{ /comp }}

## Quick verification

Run these checks after the restart:

```bash
which deno
deno --version
echo "$ENABLE_LSP_TOOL"
```

Then open a file under the NetScript app root and confirm hover, definition lookup, document symbols,
and live diagnostics work from the same Claude Code session. If the diagnostics disagree with the
project check, root the session at the app or worktree and run:

```bash
deno task check
```

Use that command as the final verdict for the workspace.
