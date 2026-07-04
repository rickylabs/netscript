# Static Gates

Static gates prove the changed files compile, format, lint, document, and remain publishable when
package scope is involved.

## Gate Definitions

| Gate             | Default command                                   | Required when                                                | Evidence                      |
| ---------------- | ------------------------------------------------- | ------------------------------------------------------------ | ----------------------------- |
| Narrow typecheck | `deno check --unstable-kv <file-or-entry>`        | Small focused changes where workspace config is not required | command output or parser JSON |
| Slice typecheck  | `.llm/tools/run-deno-check.ts -- <check command>` | Significant work or workspace-config-sensitive code          | wrapper JSON summary          |
| Format check     | `deno task fmt --check` or targeted equivalent    | Any committed docs/code where formatting matters             | command output                |
| Lint             | `deno task lint` or narrow lint target            | Code changes; docs-only runs may skip with rationale         | command output                |
| Doc lint         | `deno doc --lint <module>`                        | Public package exports, README/API docs, JSR work            | command output                |
| Publish dry-run  | `deno publish --dry-run` from package             | Published package/plugin changes                             | command output                |
| Link/path check  | focused filesystem check                          | Docs that reference local paths                              | list of checked paths         |

## Required Evidence Source (mandatory)

Static-gate evidence for **type-check, lint, and format** MUST come from the scoped wrappers —
`.llm/tools/run-deno-check.ts`, `run-deno-lint.ts`, `run-deno-fmt.ts` (with `--root … --ext ts,tsx`),
or the `deno task check|lint|fmt:check` aliases that wrap them. Raw root `deno check .` /
`deno fmt --check` / `deno lint` over the repo is **not a verdict**: it walks Markdown, generated
output, and future-wave packages. **Doc-lint** evidence uses `deno task doc:lint --root <pkg>`
(`.llm/tools/run-deno-doc-lint.ts`), which lints the full `deno.json` export map. **Dependency /
publishability** evidence (latest, outdated, why, audit, prod-install) uses the `deno task deps:*`
wrappers — never hand-rolled registry curls, never `deno outdated --latest` for "latest". The wrapper
invocations, flags, and gotcha rationale live in the **netscript-tools** and
**netscript-deno-toolchain** skills; do not restate them here.

`.llm/tools/run-deno-check.ts` can run a scoped file selection directly, parse a saved log with
`--input`, parse stdin with `--stdin`, or wrap a command after `--`. Fall back to raw output only if
a wrapper cannot run, and record why.

## Documentation-Only Runs

Docs-only runs validate by:

- checking referenced local paths exist,
- verifying docs do not contradict the authoritative source,
- checking Markdown formatting when a repo task exists,
- running no code typecheck unless docs generate or modify code examples that can be checked.

## Failure Handling

A static gate failure is normally `FAIL_FIX`. It becomes `FAIL_RESCOPE` when the failure proves the
plan omitted a necessary package/API redesign.
