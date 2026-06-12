# Slice 10 Hydration Closeout Evidence

Closeout date: 2026-06-11

## Verdict

D-5c1-2 is resolved. The Slice 10 conditional no-go is flipped to **Tier Z =
GO** for follow-on implementation work.

The blocker was Windows MAX_PATH in the deeply nested run-local spike path, not
an incompatibility between Zag, Fresh, Vite, Deno, or esbuild. The Slice 10
deliverable remains evidence-only: no package runtime code was shipped, and
Tier-Z component shipping remains Run 2+ scope.

No `LongPathsEnabled` registry change was made or required.

## Root Cause

The Vite dev server failed in the nested run directory because Deno node-compat
could not spawn an existing `esbuild.exe` whose full path exceeded the legacy
Windows 260-character process path limit. That surfaced as the misleading Deno
node-compat error:

```text
TypeError: Cannot read properties of undefined (reading 'unref')
```

Generator proof recorded in PR comment 4684398933 used a raw
`node:child_process` spawn test to confirm the existing binary can be observed
on disk while process creation fails under the long path.

Reference:
https://github.com/rickylabs/netscript/pull/31#issuecomment-4684398933

## Path Measurement

Raw PowerShell measurement of `esbuild.exe` paths:

| Host | esbuild package | Path length |
|---|---:|---:|
| Nested run dir | `@esbuild+win32-x64@0.25.12` | 299 |
| Nested run dir | `@esbuild+win32-x64@0.25.7` | 298 |
| Nested run dir | `@esbuild+win32-x64@0.27.7` | 298 |
| `%TEMP%\zag-spike-5c1` | `@esbuild+win32-x64@0.25.12` | 137 |
| `%TEMP%\zag-spike-5c1` | `@esbuild+win32-x64@0.25.7` | 136 |
| `%TEMP%\zag-spike-5c1` | `@esbuild+win32-x64@0.27.7` | 136 |

The shortest failing nested path was still above 260 characters; the short-path
copy was far below it.

## Config Matrix

Working configuration:

- `nodeModulesDir: "auto"`
- `workspace: []`
- `deno task dev`: `vite --configLoader native --host 127.0.0.1`
- `vite.config.ts`: `fresh({ serverEntry: "./main.tsx" })`

Observed failing combinations:

- Manual node modules plus native config loader:
  `ERR_UNKNOWN_FILE_EXTENSION .ts`.
- Vite bundle config loader:
  `ERR_MODULE_NOT_FOUND @fresh/plugin-vite`, because the temporary
  `node_modules/.vite-temp` bundle path cannot node-resolve the JSR-only Fresh
  plugin.
- Nested run-dir host with otherwise working config:
  process creation can fail when the resolved `esbuild.exe` path exceeds 260
  characters.

## Short-Path Re-Host Procedure

The spike was copied verbatim to `%TEMP%\zag-spike-5c1`, then validated from the
short path:

```powershell
cd $env:TEMP\zag-spike-5c1
deno install
deno task dev
```

The SSR endpoint was probed at `http://127.0.0.1:5173/`, then Playwright MCP was
used to open a fresh browser tab and inspect the served page.

## Local SSR Evidence

Raw command:

```powershell
deno task dev
```

Result from `Invoke-WebRequest http://127.0.0.1:5173/`:

- HTTP status: 200
- `#ssr-marker`: present
- server-rendered `role="combobox"` markup: present
- server-rendered `role="listbox"` markup: present

SSR head excerpt:

```html
<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body><main><h1>Zag Fresh Combobox Spike</h1><p id="ssr-marker">SSR route rendered</p><div data-zag-combobox="root"><label id="combobox:city:label">City</label><div data-part="control"><input type="text" data-scope="combobox" data-part="input" id="combobox:city:input" role="combobox" value="Zurich" aria-expanded="false"
```

The SSR body also included a server-rendered listbox with Basel, Bern,
Lausanne, and Zurich options.

## Browser / Hydration Evidence

Browser state was reset before the closeout run:

```text
browser_close -> no open tabs
```

Fresh Playwright MCP session:

```text
browser_tabs action=new url=http://127.0.0.1:5173/
```

Observed:

- Current tab URL: `http://127.0.0.1:5173/`
- Browser snapshot artifact: `.tmp\page-2026-06-11T20-13-03-717Z.yml`
- Console artifact: `.tmp\console-2026-06-11T20-13-00-248Z.log#L1`
- Additional snapshot artifact: `zag-spike-5c1-closeout-snapshot.md`

Generator Playwright interaction proof from PR comment 4684398933:

- typing expands the listbox, with `[expanded] [active]` state
- four options are visible
- clicking `Basel` commits the value to the input
- `role=status` reflects the committed value
- the listbox closes
- console is clean except favicon 404

After the closeout browser pass:

```text
browser_close -> no open tabs
server stopped
```

## Gate Evidence

Raw command from the run-local spike directory:

```powershell
deno task check
```

Exit code: 0

Resolved task:

```text
deno check --no-lock --unstable-kv main.tsx client.ts vite.config.ts routes/**/*.tsx islands/**/*.tsx
```

Checked:

- `main.tsx`
- `client.ts`
- `vite.config.ts`
- `routes/_app.tsx`
- `routes/index.tsx`
- `islands/ZagComboboxSpike.tsx`

Root lock hygiene:

```powershell
git diff -- deno.lock packages/fresh-ui/deno.lock .llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/gates/deno.lock
```

Result: no diff.
