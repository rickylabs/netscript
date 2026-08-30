---
name: deno
description: "Diagnostic instrument for the Deno runtime and toolchain. Reach for it the moment something is wrong and you do not know why. USE FOR: a process that exits silently or hangs, a dev server that 'died', type errors the editor does not show (or shows and the CLI does not), 'Import X not a dependency', unresolved/stale modules, permission denials, leaking or hanging tests, lockfile and dependency-age failures, reading a package's API. DO NOT USE FOR: Fresh/Preact/islands/Tailwind authoring (follow the project's Fresh documentation and conventions); NetScript release/dependency policy (follow the repository's checked-in release and dependency tooling). INVOKES: deno check, deno info, deno task, deno test, deno lint, deno fmt, deno doc, deno coverage, deno bench, deno clean, deno add/install/outdated/why, bash. Verified on Deno 2.9.3 — re-verify flags on other versions."
---

# Deno Toolchain Diagnostics

**The runtime will tell you what is wrong. Ask it.** Every symptom below has a command that answers
it in seconds. Guessing, re-running, and re-reading source is what burns hours.

Everything here was executed on **Deno 2.9.3** (`deno --version`). Behaviour marked _(2.9)_ is
version-sensitive — re-check with `deno <cmd> --help` before trusting it on another release.

## The exit-code trap — read this first

**A pipeline reports the _last_ stage's status.** Verified: `deno check main.ts` exits 1; but

```bash
deno check main.ts | tail -1   # -> prints "error: Type checking failed."  and exits 0
```

This is true whether you pipe on the command line **or bake the pipe into a `deno.json` task** — a
task defined as `"check": "deno check main.ts | tail -1"` reports exit 0 while type checking fails.

Fixes, in order of preference: **do not pipe**; or `set -o pipefail`; or read `${PIPESTATUS[0]}`.

Three more sources of a lying exit 0, all verified:

| Command                                         | Silent success                                            | Why                                                                                                                                           |
| ----------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `deno check <path excluded by deno.json>`       | prints `Warning No matching files found.` and **exits 0** | `deno lint` / `deno fmt --check` / `deno test` instead print `error: No target files found.` and exit **1**. `deno check` is the odd one out. |
| `deno run file.ts` on a file with type errors   | runs and exits 0                                          | `deno run` does **not** type-check. Use `deno check`, or `deno run --check`.                                                                  |
| `deno info file.ts` with an unresolvable import | prints `(resolve error)` and **exits 0**                  | Read the tree, not the code.                                                                                                                  |

**Rule: verify the artefact, never the exit code.** Did the file appear, did the port open, did the
type error text vanish. Generators, installers and builds all exit 0 while producing nothing.

In an initialized NetScript project, use
`deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root <path> --pretty`. It
enumerates explicit inputs, reports `selection.filesSelected`, and fails when selection is empty,
closing the excluded-file exit-0 trap.

## CLI command reference

| Task                                                       | Command                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------ |
| Type-check the whole project (honours `include`/`exclude`) | `deno check`                                                       |
| Type-check one file + its graph                            | `deno check path/to/file.ts`                                       |
| Type-check a file the config excludes                      | `deno check --no-config path/to/file.ts`                           |
| Also type-check npm/remote deps                            | `deno check --all <file>`                                          |
| Show the resolved module graph                             | `deno info <file-or-specifier>`                                    |
| Machine-readable graph + on-disk paths                     | `deno info <specifier> --json`                                     |
| Show `DENO_DIR` and every cache location                   | `deno info` (no args)                                              |
| Who pulls in a package                                     | `deno why <pkg>`                                                   |
| List tasks                                                 | `deno task` (no args)                                              |
| Lint                                                       | `deno lint` / `--compact` / `--json` / `--rules`                   |
| Format check (diff + exit 1)                               | `deno fmt --check`                                                 |
| Run tests                                                  | `deno test [--filter <s>] [--fail-fast[=N]] [--reporter=dot]`      |
| Tests touching a file / changed files                      | `deno test --related=<file>` / `deno test --changed`               |
| Catch leaks _(2.9: opt-in)_                                | `deno test --sanitize-ops --sanitize-resources [--trace-leaks]`    |
| Coverage                                                   | `deno test --coverage=cov` then `deno coverage cov --detailed`     |
| Benchmarks                                                 | `deno bench [--filter <s>] [--json]`                               |
| Public API of a module                                     | `deno doc <specifier>` / `--filter <Symbol>` / `--lint <files...>` |
| Re-fetch one dependency                                    | `deno check --reload=npm:<pkg> <file>`                             |
| See what a cache wipe would cost                           | `deno clean --dry-run`                                             |
| Debugger                                                   | `deno run --inspect-brk <file>` / `--inspect-wait`                 |
| Op-level trace                                             | `deno run --trace-ops=<op,op> <file>`                              |
| Verbose runtime log                                        | `deno run -L debug <file>`                                         |

**Always prefix `NO_COLOR=1`** when you will read or grep the output. Deno emits ANSI escapes even
when stdout is redirected to a file — verified with `od -c` on `deno doc > file`.

## Key workflows

### Debugging issues

Match the symptom, run the command, read the named field.

**"The process exits with no output" / "the dev server died silently."**

1. Stop backgrounding it. Run it in the foreground and keep stderr:
   `deno task dev > /tmp/dev.log 2>&1; echo "exit=$?"` — never `| tee`, that eats the exit code.
2. Read the exit code. `0` = nothing kept the event loop alive (an aborted `AbortController`, a
   server that never listened). `1` = uncaught error, and the text is on **stderr**. `124` = your
   own `timeout`. `137` = SIGKILL / OOM.
3. Port conflicts look like
   `error: Uncaught (in promise) AddrInUse: Address already in use
   (os error 98)` — stderr only.
   If you discarded stderr you saw "silent".
4. Still opaque: `deno run -L debug <entry>`. It logs every module load, V8 code-cache hit, and ends
   with `received module evaluate Ok(())` — that line proves the module evaluated, so the problem is
   after evaluation, not in resolution.
5. Attach a debugger: `--inspect-brk` (break at first line) or `--inspect-wait` (wait for a client,
   then run). Both default to `127.0.0.1:9229`.

**"It hangs."** `deno run --trace-ops=op_timer_schedule,op_read <file>` — bare `--trace-ops` is a
flood, always pass the comma-separated filter. Look for a `Dispatched` with no matching `Completed`.

**"Type errors, but the editor is fine" (or the reverse).** The editor is the LSP: it checks only
open files. `deno check` follows real module graphs and obeys `deno.json`.

- `deno check` (no args) checks **every** project file — the editor never does this.
- `deno check file.ts` checks _only that file and what it imports_. A task defined as
  `deno check main.ts` proves nothing about the other 200 files.
- If `deno check <file>` says `Warning No matching files found.`, the path is **excluded** in
  `deno.json`. Re-run with `--no-config` to check it anyway.
- Errors inside npm/remote packages are skipped by default; `deno check --all <file>` includes them.

**"Type errors from generated code" (Prisma client, codegen output).** Generated directories are
almost always in `exclude`, so plain `deno check` skips them and `deno check <that file>` exits 0
silently. Do both of these before touching the generator:

```bash
NO_COLOR=1 deno check --no-config path/to/generated/client.ts   # the real diagnostics
NO_COLOR=1 deno info path/to/generated/client.ts                # which .d.ts is actually loaded
```

**`Import "zod" not a dependency and not in import map`.** This is not a framework bug. It is
resolution. `deno check` already prints the fix as a hint (`try running deno add npm:zod`). Confirm
with the graph:

```bash
NO_COLOR=1 deno info src/thing.ts
# └── Import "zod" not a dependency ...  (resolve error)     <- unresolved edge
# └── npm:/zod@4.4.3 (4.35MB)                                <- resolved edge
```

`deno info <specifier> --json` gives `npmPackages["zod@4.4.3"].localPath` — the exact directory in
the cache. Read the real `.d.ts` there instead of guessing at the types.

**"A permission error."** Deno names the capability _and_ the exact resource:
`NotCapable: Requires env access to "HOME", run again with the --allow-env flag`. Grant the
narrowest thing that satisfies it — `--allow-env=HOME`, `--allow-read=./data`,
`--allow-net=127.0.0.1:8000`. Scoping is literal: `--allow-net=example.com` does **not** permit
binding `0.0.0.0:8124`. In non-interactive/agent runs add `--no-prompt` (or `DENO_NO_PROMPT=1`) so a
missing permission fails immediately instead of blocking on an invisible prompt.
`DENO_TRACE_PERMISSIONS=1` adds stack traces.

**"A test hangs or leaks."** _(2.9)_ **Ops and resource sanitizers are off by default since 2.8** —
a test that leaves a timer or an open file passes. Turn them on:

```bash
deno test --sanitize-ops --sanitize-resources          # or DENO_TEST_SANITIZE_OPS=1
deno test --sanitize-ops --trace-leaks                 # adds the stack where the leak started
```

`--trace-leaks` turns `A timer was started in this test, but never completed` into the exact source
line. Narrow the run with `--filter <substring-or-regex>`, `--fail-fast`, `--related=<file>` (note
the `=`; a space errors), or `--changed` (needs a git repo). `--no-run` type-checks the test files
without executing them. `--reporter=dot` for compact output.

**"It worked yesterday" / stale-cache suspicion.**

```bash
NO_COLOR=1 deno info                       # DENO_DIR + remote / npm / gen cache paths
deno check --reload=npm:<pkg> <file>       # re-fetch ONE dep; `npm:` alone reloads all npm
DENO_DIR=/tmp/deno-probe deno check <file> # reproduce against a pristine cache, destroys nothing
deno clean --dry-run                       # "Removed <dir> (728938 files, 13.88GB)" then aborts
```

Prefer an isolated `DENO_DIR` over `deno clean`. `deno clean` wipes the whole shared cache;
`deno clean -e <files>` retains what those files need.

### Verifying a change

Run the smallest command that proves it, and read the output rather than the status:

```bash
NO_COLOR=1 deno check                    # every project file
NO_COLOR=1 deno lint --compact           # one line per problem
NO_COLOR=1 deno fmt --check              # unified diff of what would change
NO_COLOR=1 deno test --fail-fast
```

`deno lint --rules` lists all ~120 rules with tags; `--rules-include` / `--rules-exclude` /
`--rules-tags` adjust the set; `--json` is stable for scripting.

### Coverage and performance

```bash
deno test --coverage=cov            # prints the summary table AND writes cov/lcov.info + cov/html
deno coverage cov --detailed        # per-file %, then the uncovered source lines
deno test --coverage=cov --coverage-threshold=80   # fails below the threshold
deno bench --filter <name>          # add `group` + `baseline: true` to Deno.bench for a comparison
```

`deno coverage` failing with `No covered files included in the report` means the tests never
imported any local module — the report is empty, not broken.

### Reading a package's API

`deno doc` is the cheapest way to learn a surface, but three things trip agents up:

- **It documents only the root export (`.`)**, not every subpath. `deno doc npm:zod` returned zero
  `v3/` symbols even though `zod/v3` is a declared export. Name subpaths explicitly:
  `deno doc jsr:@std/testing/mock`.
- **If there is no root export it errors — and the error lists every subpath.**
  `deno doc
  jsr:@std/testing` fails with `Unknown export '.'` followed by
  `./bdd ./mock ./snapshot ...`. That failure is the cheapest way to enumerate a package's
  entrypoints.
- **It is enormous.** `deno doc npm:zod` is 4,355 lines. Always `deno doc --filter <Symbol> <spec>`.

`deno doc <dir>` documents every file in that directory (including `deno.json`, oddly).
`deno doc --lint <file...>` requires explicit files — it will not infer them from an export map.

### Dependencies, lockfile, and dependency age

```bash
deno add npm:zod jsr:@std/path      # writes deno.json imports + deno.lock
deno install                        # install everything the config declares
deno outdated [--latest] [--update] # inventory; --update rewrites specifiers
deno why <pkg>                      # provenance
deno ci                             # frozen install from the lockfile, for CI
```

`--frozen` turns lockfile drift into a real failure with a diff:
`error: The lockfile is out of date. Run 'deno install --frozen=false' ...`.

_(2.9, unstable)_ **`--minimum-dependency-age` defaults to 24 hours.** A version published minutes
ago fails to resolve with
`A newer matching version was found, but it was not used because it was
newer than the specified minimum dependency date`.
Alias `--min-dep-age`; values are minutes (`120`), ISO-8601 durations (`P2D` — years are rejected),
or a date (`2025-09-16`); `0` disables. The durable fix is `"minimumDependencyAge"` in `deno.json`,
not a flag on one command.

**Two traps around that flag, both verified:**

1. **`deno task` does not accept `deno run` flags.** `deno task --minimum-dependency-age=0 dev`
   fails with `error: unexpected argument '--minimum-dependency-age' found`. `deno task` has its own
   small flag set (`--cwd`, `--eval`, `--filter`, `--jobs`, `--if-present`, `--recursive`, `-c`).
   Anything after the task **name** is appended to the task's command line, not parsed by Deno.
   Options: put the flag in the task, use `deno task --eval "deno run --min-dep-age=0
   main.ts"`,
   or run the underlying `deno run` directly.
2. **`deno x` does not pass it to the child.** `deno x` applies the flag while resolving/installing
   the binary, then re-execs the tool as a _separate process_ whose argv is
   `deno run --allow-all file:///…/deno_x_cache/npm-<tool>/…` — confirmed by `ps`. The flag is
   absent, so anything the tool resolves at runtime falls back to the default 24-hour policy. Set
   `minimumDependencyAge` in `deno.json` when a `deno x` tool needs a different policy.

## Important rules

- **Never conclude from an exit code you obtained through a pipe.** `cmd | tail` reports `tail`.
- **`deno run` does not type-check.** "It ran" is not evidence about types. Only `deno check` is.
- **`deno check <excluded-file>` exits 0 with a warning.** If output is
  `Warning No matching files
  found.`, you checked nothing — re-run with `--no-config`.
- **Reach for `deno info` before reading source.** Nearly every "framework bug" that turns out to be
  an import-map, version, or cache problem is visible in one `deno info` tree.
- **Prefix `NO_COLOR=1`** on anything you will parse — Deno colours output even when redirected.
- **Enable test sanitizers explicitly** _(2.9)_. Green tests do not mean no leaks.
- **Do not run `deno clean` to test a stale-cache hypothesis.** Use `DENO_DIR=<tmpdir>` — it proves
  the same thing and destroys nothing. Treat `deno clean` and unscoped `--reload` as needing
  approval; prefer `--reload=<specifier>`.
- **Grant the narrowest permission the error names**, never `-A`, when diagnosing.
- **Add `--no-prompt`** in unattended runs so a permission gap fails instead of hanging.
- Prefer `docs.deno.com` and `deno <cmd> --help` over recalled flags. Several 2.9 behaviours
  (sanitizers off by default, the 24-hour dependency-age default) invert older documentation.

### Verification notes

- `deno lint --fix` is documented as fixing "rules that support it", but on 2.9.3 it modified no
  file across four attempts (`prefer-const`, `no-unused-vars`, `eqeqeq`, `no-inferrable-types`) and
  still exited 1. **Re-read the file after running it; do not assume it fixed anything.**
- `deno test` flags `--repeats`, `--retry`, `--shard`, `--update-snapshots` were confirmed present
  in `--help` but not exercised.
- The `deno x` child-process finding was verified by inspecting the live process tree, not by
  triggering a real age rejection inside a tool's runtime resolution.
- All `deno check` / `deno info` / `deno test` / `deno doc` behaviours above were reproduced on a
  scratch project. The claim that the **editor** checks only open files is standard LSP behaviour
  and was _not_ re-verified here — the CLI half of the comparison was.
