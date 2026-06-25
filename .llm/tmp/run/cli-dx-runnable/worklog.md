# Worklog — CLI `dx`-runnable slice

Run-id: `cli-dx-runnable` · Branch: `feat/cli-dx-runnable` · PR: #120

## Design

- Public surface: `@netscript/cli` keeps `.` as the library import surface (`createPublicCli` and existing public exports) and makes that same default export runnable under Deno's JSR execution resolver via an `import.meta.main` guard. Existing `./scaffolding` and `./testing` exports remain import-only.
- Domain vocabulary: executable JSR export, default export, named subpath export, import-purity guard, verified command form.
- Ports: no new product ports. The runnable module reuses the existing `runPublicCli` runtime host callbacks for cwd, path resolution, and error output.
- Constants: no new product constants. The verified public command form for this local Deno 2.8.3 toolchain is `deno x jsr:@netscript/cli <args>`.
- Commit slices:
  - S1: make the default export runnable, add import-purity test, run publish/check/lint/fmt/test gates.
  - S2: sweep user-facing docs from `jsr:@netscript/cli/bin/netscript.ts` to the verified `deno x jsr:@netscript/cli ...` form, then run residual grep and docs formatting gates.
- Deferred scope: no CLI behavior changes, no subcommands, no publish-order/workflow changes, no maintainer local-source command changes, and no post-publish `@netscript/cli` `deno x` smoke until #111 publishes CLI last.
- Contributor path: future runnable-surface edits should start in `packages/cli/mod.ts` for the default JSR export and keep `packages/cli/bin/netscript.ts` as the installable script entry.

## S1 — Runnable Export

### Empirical `deno x` / `dx` Resolution

Environment:

```text
deno 2.8.3 (stable, release, x86_64-unknown-linux-gnu)
v8 14.9.207.2-rusty
typescript 6.0.3
```

Official docs: <https://docs.deno.com/runtime/reference/cli/x/> documents `deno x` as the package
execution command, `deno x --install-alias` as the installer for a standalone `dx` alias, and JSR
execution as a module export guarded with `import.meta.main`.

Commands and observed output:

| Command | Exit | Observed output / result |
| --- | ---: | --- |
| `deno dx jsr:@std/http/file-server --help` | 1 | `error: Module not found "file:///home/codex/repos/netscript-cli-dx-runnable/dx"` |
| `deno help` | 0 | Lists `run`, `serve`, `task`, etc.; no `dx` subcommand appears. |
| `deno x jsr:@std/http/file-server --help` | 0 | Installs `@std/http` and prints `Deno File Server 1.1.1` usage. This verifies subpath export execution. |
| `timeout 3s deno x jsr:@std/http/file-server --port=0 --host=127.0.0.1 .` | 124 | Starts the file server and prints a random local port, verifying forwarded script args reach the program. |
| `deno x jsr:@std/bytes --sentinel-arg` | 0 | Installs and exits without error, verifying a bare JSR package resolves its `.` default export. |
| `deno x jsr:@maximilian-hammerl/deno-project-config-check --debug --check-imports=false --check-unstable=false --git=false` | 0 | Bare package executable prints parsed `CLI arguments` with those flags reflected, verifying bare default export execution and argument forwarding. |
| `deno x jsr:@justbyitself/genalia --help` | 0 | Bare package executable prints `Usage: genalia <module|directory> [options]`, another bare executable reference. |

Decision: **Option A**. Bare JSR package execution resolves the default export, so `@netscript/cli`
can expose the short default form. The verified Deno command in this toolchain is
`deno x jsr:@netscript/cli <args>`. `deno dx ...` is not a runnable `deno` subcommand here; see
`drift.md`.

### Implementation Notes

- `packages/cli/bin/netscript.ts` exposes `runNetscriptCli()` while keeping its existing
  `import.meta.main` guard.
- `packages/cli/mod.ts` now keeps the library export and adds an `import.meta.main` guard that calls
  the shared `runNetscriptCli()` entry.
- No `packages/cli/deno.json` export-map or `publish.include` edit was required for Option A:
  `.` already maps to `./mod.ts`, and `mod.ts` already ships in `publish.include`.
- `packages/cli/module_import_side_effect_test.ts` imports `./mod.ts`, `./scaffolding.ts`, and
  `./testing.ts` and asserts expected exported functions are present; if the CLI runner executed on
  import, the test process would print/exit before those assertions.
- S1 diff adds no `as` casts. Existing package casts remain unchanged.

### S1 Gate Evidence

| Gate | Command | Exit | Evidence |
| --- | --- | ---: | --- |
| Local executable default export | `deno run --allow-all packages/cli/mod.ts --help` | 0 | Printed the existing `netscript` help and command list. |
| Guard test | `deno test --allow-all packages/cli/module_import_side_effect_test.ts` | 0 | `1 passed | 0 failed`. |
| Focused CLI tests | `deno test --allow-all packages/cli/module_import_side_effect_test.ts packages/cli/scaffolding_test.ts packages/cli/testing_test.ts` | 0 | `6 passed | 0 failed`. |
| Scoped check | `deno check --unstable-kv packages/cli/bin/netscript.ts packages/cli/bin/netscript-dev.ts packages/cli/mod.ts packages/cli/maintainer.ts packages/cli/scaffolding.ts packages/cli/testing.ts packages/cli/module_import_side_effect_test.ts` | 0 | Checked all listed CLI entry/test files. |
| Scoped lint | `deno lint --ext=ts packages/cli` | 0 | `Checked 73 files`. |
| Scoped fmt | `deno fmt --check --no-config --single-quote --line-width 100 mod.ts module_import_side_effect_test.ts scaffolding.ts testing.ts bin/netscript.ts bin/netscript-dev.ts maintainer.ts` from `packages/cli` | 0 | `Checked 7 files`. Root/package config excludes `packages/cli`, so this preserves the repo's single-quote CLI style explicitly. |
| Publish dry-run | `deno publish --dry-run --allow-dirty --no-check=remote` from `packages/cli` | 0 | `Success Dry run complete`; existing unanalyzable dynamic-import warnings only. Dry-run file list includes `bin/netscript.ts` and `mod.ts`. |
| Zero-cast delta | `git diff -- packages/cli/mod.ts packages/cli/module_import_side_effect_test.ts \| rg -n "\\bas\\b" \|\| true` | 0 | No output; S1 adds no casts. |
| Full scaffold runtime E2E | not run | n/a | Not required by plan: no scaffold/runtime behavior changed, and maintainer/dev path is untouched. |

Notes:

- Initial `deno lint packages/cli --ext ts` exited 1 because Deno 2.8 requires `--ext=ts`; rerun
  with `--ext=ts` passed.
- Initial raw `deno fmt --check packages/cli --ext ts` inspected non-TS files under
  `packages/cli/e2e` and failed on JSON/Markdown parsing. The accepted scoped TS-only command above
  passed.
- Reference-package `deno x` probes temporarily added entries to `deno.lock`; those probe-only
  entries were removed before staging and are not part of the slice.
