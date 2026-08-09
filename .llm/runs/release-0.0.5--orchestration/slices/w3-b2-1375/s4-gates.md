# S4 non-serialized gate ledger — #1375

Date: 2026-08-09

Every verdict below executed and reports its raw exit code. The serialized runtime row has not run
and is not represented as a pass. Repository-wide quality/doctrine commands are retained as
execution evidence, but #1403 proves their root lists do not cover this slice's MCP surface.

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
| Repository quality aggregate | `deno task quality:gate` | 0 | quality scan covered owned CLI source but omitted `packages/mcp`; not MCP evidence (#1403) |
| Repository doctrine aggregate | `deno task arch:check` | 0 | root list covered neither owned package; not slice evidence (#1403) |
| Scoped MCP quality | `deno run --allow-read .llm/tools/quality/scan-code-quality.ts --root packages/mcp/src` | 0 | no findings; allowance count 0 |
| Scoped MCP doctrine | `deno run --allow-read --allow-run .llm/tools/fitness/check-doctrine.ts --root packages/mcp` | 1 | owned A8 line-cap warning repaired; rerun contains only pre-existing #1403 triage listed below |
| MCP doc-lint | `deno task doc:lint --root packages/mcp --pretty` | 0 | combined errors/private refs/missing JSDoc all 0 |
| CLI doc-lint | `deno task doc:lint --root packages/cli --pretty` | 0 | combined errors/private refs/missing JSDoc all 0 |
| MCP JSR audit | `deno publish --dry-run --allow-dirty` in `packages/mcp` | 0 | slow-type check and intended publish file list pass |
| CLI JSR audit | `deno publish --dry-run --allow-dirty --no-check=remote` in `packages/cli` | 0 | pass; four pre-existing unanalyzable dynamic-import warnings |
| Registry-safe assets | `deno task release:preflight` | 0 | text imports, import attributes, file-URL import-meta, self-imports all PASS |
| Workspace publish | `deno task publish:dry-run` | 0 | workspace simulation complete; baseline dynamic-import warnings only |
| Review threads | `deno task agentic:review-threads -- --repo rickylabs/netscript --pr 1401 --pretty` | 0 | threads 0, unanswered 0 |
| Lock hygiene | `git diff origin/main -- deno.lock` | 0 | empty diff |
| Serialized runtime | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | 0 | passed=78 failed=0 skipped=2; only the two expected #1398 deferrals |

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

## #1403 scoped coverage correction

- The repository `quality:gate` exit `0` does not cover `packages/mcp`; its scan roots include
  `packages/cli/src` and therefore do cover this slice's CLI source. The direct MCP quality scan
  exited `0` with no findings and no allowances.
- The repository `arch:check` exit `0` covers neither `packages/mcp` nor `packages/cli`, so it is not
  doctrine evidence for this slice. The first direct MCP doctrine run exited `1` and reported an A8
  300-line warning in changed `tool-contracts.ts`; that file was 298 lines at the base and this
  slice had raised it to 304. Compacting the schema declaration reduced it below the cap.
- The direct MCP doctrine rerun still exited `1` solely for pre-existing, untouched findings: F-16
  directory-size warnings for `src/domain` (14 children) and `src/application/flows` (16), A9
  informational absence of `docs/architecture`, and A14 Jest/Vitest globals in
  `tests/service-endpoint-sources_test.ts`. That test has an empty diff against `origin/main`.
- The owned repair was re-proved by `deno test -A --no-lock packages/mcp/tests/registry_test.ts`
  (raw exit `0`, 5 passed, 0 failed) and the scoped formatter over `tool-contracts.ts` (raw exit
  `0`, 1 file, 0 findings).

## JSR audit finding

The change uses checked-in TypeScript constants for package prose and provenance, with no runtime
package-file reads or import attributes. MCP publishes the new internal adapter and 98.95 KiB
generated asset; tests and run artifacts remain excluded. No export-map key was added. The CLI's
four dynamic-import warnings predate and do not intersect this slice.

## Serialized runtime and resource hygiene

- Grant: orchestrator ledger row 51; W3-B2 held the token for exactly one run.
- Pre-run leak-check raw exit `0`; artifact reported healthy Aspire/Docker probes and only foreign
  `redis-jfgcbtaf`, owned by `/home/codex/repos/w6-review-desk`. It was left untouched.
- Runtime raw exit `0`; full aggregate: `passed=78 failed=0 skipped=2`.
- Expected and actual skips were exactly `behavior.otel.stream-consumer` and
  `behavior.otel.traces`, both deferred by #1398. No other gate skipped.
- Post-run leak-check raw exit `0`; artifact again reported healthy probes, no slice-owned survivor,
  and only the same untouched foreign Redis container.
- Review-thread gate rerun raw exit `0`: `threads=0 unanswered=0`.

## Eleven-row closure audit

| Live #1375 acceptance row | Verdict and evidence |
| --- | --- |
| `agent init --with-docs` emits `--docs-root` to installed bundle | PROVEN — all-host focused test and generated-project command inspection, 48/48 |
| Every emitted host config carries the same wiring | PROVEN — Claude `.mcp.json`, VS Code `.vscode/mcp.json`, and Zed settings share the same absolute root |
| No flag/env probes `<projectRoot>/.netscript/docs` | PROVEN — focused precedence test selects indexable project corpus |
| Flag overrides env, env overrides probe | PROVEN — resolver matrix plus real stdio env-over-probe test |
| Embedded corpus contains enumerated generated golden paths | PROVEN — release adapter and generator locked-path tests |
| Embedded corpus has framework provenance and fails closed on mismatch | PROVEN — generated provenance assertions and synchronous version-mismatch negative |
| Embedded corpus size budget is asserted | PROVEN — generator test asserts `79_292 <= 262_144` and freshness gate passes |
| `list_docs` reports kind/root/document count | PROVEN — live filesystem and embedded result tests plus exact output schema |
| Bundle/filesystem, no-bundle/embedded, and full precedence covered | PROVEN — focused docs/init matrix, including real stdio processes |
| Empty/non-indexable probe falls back observably to embedded | PROVEN — empty/redirect/non-Markdown probe negatives report embedded metadata |
| Embedded provenance version mismatch fails construction | PROVEN — named synchronous constructor negative |

All eleven rows are truthfully tickable. The decisive defect proof is
`generated project search_docs reaches its installed corpus after host restart`: a real local CLI
stdio process launched from generated host arguments returns installed slug
`pages/services-sdk/services`, rather than the prior two-document `mcp` + `help` corpus, and
`list_docs` reports filesystem kind, installed root, and total document count.

Token release: the single granted run is complete; release reported to the orchestrator for PR
#1401 / slice `w3-b2-1375`.
