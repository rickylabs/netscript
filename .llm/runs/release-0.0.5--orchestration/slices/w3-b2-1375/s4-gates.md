# S4 non-serialized gate ledger — #1375

Date: 2026-08-09

Every green row below executed and reports its raw exit code. The serialized runtime row has not
run and is not represented as a pass.

| Gate | Command / selection | Raw exit | Named result |
| --- | --- | ---: | --- |
| Focused CLI/MCP | `deno test -A --no-lock` over init, docs, registry, release adapter, generator | 0 | 48 passed, 0 failed, no skips; decisive generated-project stdio search GREEN |
| Publish assets | `deno task check:publish-assets` | 0 | generated fallback and README asset current |
| Scoped check | check wrapper over MCP, CLI init, and two generator files with `--no-lock` | 0 | 115 files, 1 batch, 0 failures/diagnostics |
| Scoped lint — MCP | lint wrapper + `packages/mcp/deno.json` | 0 | 105 files, 0 findings |
| Scoped lint — CLI init | lint wrapper + `packages/cli/deno.json` | 0 | 8 files, 0 findings |
| Scoped lint — generator | lint wrapper + `packages/cli/deno.json` | 0 | 2 files, 0 findings |
| Scoped format — MCP | fmt wrapper check after formatting four owned findings | 0 | 105 files, 0 findings |
| Scoped format — CLI init | fmt wrapper check | 0 | 8 files, 0 findings |
| Scoped format — generator | fmt wrapper check | 0 | 2 files, 0 findings |
| Framework quality | `deno task quality:gate` | 0 | no findings; existing allowance count 7 |
| Doctrine fitness | `deno task arch:check` | 0 | no failures; repository baseline warnings only |
| MCP doc-lint | `deno task doc:lint --root packages/mcp --pretty` | 0 | combined errors/private refs/missing JSDoc all 0 |
| CLI doc-lint | `deno task doc:lint --root packages/cli --pretty` | 0 | combined errors/private refs/missing JSDoc all 0 |
| MCP JSR audit | `deno publish --dry-run --allow-dirty` in `packages/mcp` | 0 | slow-type check and intended publish file list pass |
| CLI JSR audit | `deno publish --dry-run --allow-dirty --no-check=remote` in `packages/cli` | 0 | pass; four pre-existing unanalyzable dynamic-import warnings |
| Registry-safe assets | `deno task release:preflight` | 0 | text imports, import attributes, file-URL import-meta, self-imports all PASS |
| Workspace publish | `deno task publish:dry-run` | 0 | workspace simulation complete; baseline dynamic-import warnings only |
| Review threads | `deno task agentic:review-threads -- --repo rickylabs/netscript --pr 1401 --pretty` | 0 | threads 0, unanswered 0 |
| Lock hygiene | `git diff origin/main -- deno.lock` | 0 | empty diff |
| Serialized runtime | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | NOT_RUN | token requested below; no container/AppHost command started |

## Non-verdict attempts and repairs

- A combined lint wrapper invocation exited `1` before lint because Deno rejected the root
  workspace configuration. It produced zero lint occurrences and explicitly reported a tooling
  setup failure. The same 115-file selection was split across package-local configs; all three
  actual lint verdicts are green above.
- Initial MCP format check exited `1` with four owned formatting findings. The scoped formatter
  changed only those four files; the 105-file MCP recheck then exited `0`. Focused tests were rerun
  afterward and remained 48/48.
- The first workspace publish capture outlived its output session and produced no exit verdict. Its
  process was allowed to finish, then the exact command was rerun and returned raw exit `0`; only
  the rerun is counted above.

## JSR audit finding

The change uses checked-in TypeScript constants for package prose and provenance, with no runtime
package-file reads or import attributes. MCP publishes the new internal adapter and 98.95 KiB
generated asset; tests and run artifacts remain excluded. No export-map key was added. The CLI's
four dynamic-import warnings predate and do not intersect this slice.

## Serialized handoff

`EXPENSIVE-GATE-REQUEST`

The serialized gate token is requested for PR #1401 / slice `w3-b2-1375`. Do not run until the
orchestrator records and communicates the ledger grant. After grant: leak-check, exact one-pass
runtime command, post-run leak-check.
