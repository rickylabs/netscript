# IMPL-EVAL cycle 2 — #1112 / draft PR #1711

## Verdict: `PASS_IMPL`

No BLOCKING finding. Five ADVISORY findings, none of which touches a product path. The generated
derivative cascade is complete and byte-reproducible; the gate set is now sufficient for this
leaf; gate 5 is load-bearing; the seven-path envelope and `deno.lock` hold.

## Head identity

| Field                 | Value                                                                              |
| --------------------- | ---------------------------------------------------------------------------------- |
| Evaluated head        | `067193acff68254b4bd4c6e5d7824f80a9db2b26` (= PR `headRefOid` at evaluation time)  |
| Base                  | `cf648f1ff973d74c213bb125a6f5f5b9328e693b` (= `git merge-base HEAD base`)          |
| Commits over base     | 16 (`8c4bef940` … `067193acf`)                                                     |
| Delta since cycle 1   | `bbaf70d64` (2 JSDoc lines in `examples/basic-usage.ts`), `a727c7565` + `361feca71` (derivative cascade), `067193acf` (run artifacts only) |
| PR state              | draft · `status:impl` · milestone `0.0.7` · labels `type:docs priority:p1 area:database` |
| Evaluator             | fresh Claude Fable 5 session, 2026-08-29; distinct from the Codex author (`gpt-5.6-sol`), the topic supervisor, both PLAN-EVAL sessions, and the IMPL-EVAL cycle-1 session |
| Evaluator worktree    | `/home/codex/repos/netscript-007-eval-1711-impl2` (detached at head; `git status --porcelain` empty before and after) |

## Reproduction environment

- Deno 2.9.5 (stable, x86_64-unknown-linux-gnu), TypeScript 6.0.3; Prisma 7.8.0 for gate 5.
- Every probe ran in a pristine tracked-files-only archive under the job tmp dir
  (`git archive <sha> | tar -x`), never in a repo checkout. Six head archives (`head-a…e`, plus the
  git-initialised `head-b`) and two base archives (`base-a`, `base-b`) were used so that no
  lock-sensitive gate followed another probe in the same tree. `deno.lock` sha256
  `edfa0c24…1820c` was recorded before and after every archive's probes and never changed.
- No live MySQL, Aspire, Docker, browser, `e2e:cli`, release gate, or expensive-gate lease was
  used. The one execution beyond the import-only smoke is disclosed as A5.

## Re-derived gate table

| #  | Gate                                 | Command (archive)                                                                                                                     | Result                                                                                                                    |
| -- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1  | Clean-root shell, `.generated` absent | `run-deno-check.ts --root packages/prisma-adapter-mysql --ext ts,tsx` (head-a, never generated)                                        | 12 selected / 0 failed batches / 0 diagnostics, exit 0                                                                     |
| 1' | Same, after gate-5 cleanup ×2        | same command in head-d after each of two generate→probe→`rm -rf .generated` cycles                                                     | 12 / 0 / 0, exit 0 both times; `examples/` contains only `basic-usage.ts`                                                  |
| 2  | Focused adapter tests                | `run-deno-test.ts -- --allow-all packages/prisma-adapter-mysql/tests/connection_errors_test.ts` (head-a)                               | 38 passed / 0 failed, exit 0                                                                                               |
| 3  | Docs source format                   | `deno task --cwd docs/site check:source-format` (head-a)                                                                               | `Docs source format: OK`, exit 0                                                                                           |
| 4  | Docs accuracy                        | `deno task docs:accuracy` (head-a)                                                                                                     | `docs accuracy: PASS` (199 published source pages), exit 0                                                                 |
| 5a | Scratch generation                   | plan's exact schema + `prisma-example-check-deno.json` in `.llm/tmp`; `deno run -A --no-lock npm:prisma@7.8.0 generate` (head-d)        | `Generated Prisma Client (7.8.0) to ./packages/prisma-adapter-mysql/examples/.generated`, exit 0                            |
| 5b | Actual example under real client     | `run-deno-check.ts --file …/examples/basic-usage.ts --ext ts --deno-arg --config=.llm/tmp/prisma-example-check-deno.json`             | 1 selected / 0 diagnostics, exit 0                                                                                         |
| 5c | Guarded import-only smoke            | `deno eval --no-lock --config=… 'await import(<example>); console.log("dynamic-import-smoke:ok")'`                                    | prints `dynamic-import-smoke:ok`, exit 0; no MySQL contacted                                                               |
| 6  | Package full tests                   | `run-deno-test.ts -- --allow-all packages/prisma-adapter-mysql/tests` (head-a)                                                         | 51 passed / 0 failed, exit 0                                                                                               |
| 7  | Package lint                         | `run-deno-lint.ts --root packages/prisma-adapter-mysql --ext ts` (head-a)                                                              | 12 selected, 0 findings, exit 0                                                                                            |
| 8  | Package format                       | `run-deno-fmt.ts --root packages/prisma-adapter-mysql --ext ts` (head-a)                                                               | 12 selected, 0 findings, exit 0                                                                                            |
| 9  | Full export-map doc lint             | `deno task doc:lint --root packages/prisma-adapter-mysql --pretty` (head-a)                                                            | entrypoint `./mod.ts` exit 0; `combinedPrivateTypeRef: 0`, `combinedMissingJSDoc: 0`, `combinedTotal: 0`                   |
| 10 | Quality/doctrine gate                | `deno task quality:gate` in fresh head-c, then again in fresh head-e vs fresh base-b for comparison                                    | exit 0 all three runs. Package section identical head vs base (`FAIL=0 WARN=2 INFO=1`); only diff is pre-existing A8 line count 809→816. `deps:check:zod` green. |
| 11 | Publish dry-run                      | `deno task --cwd packages/prisma-adapter-mysql publish:dry-run` (head-a)                                                               | `Success Dry run complete`, 8 files (README, deno.json, mod.ts, src/{adapter,conversion,errors,mod,types}.ts); no example/test file |
| 12 | JSR audit                            | `deno run -A .llm/tools/fitness/audit-jsr-package.ts --root packages/prisma-adapter-mysql --text` (head-a)                             | exit 0; one `WARN F-JSR-7 slow-types` that is the known banner false-positive (raw dry-run above shows no slow-type diagnostic) |
| 13 | Driver falsehood census              | `grep -n -i` over the seven paths for `deno-native|deno_mysql|native mysql|Deno MySQL|from "@prisma/client"|declare const|.dispose()|factory.connect|fully compatible|unsupported|#1293|DenoMySql|QueryResult|FieldInfo|number[]|connection string|Deno-compatible|mariadb` — every hit read | Remaining hits are the true mysql2/MariaDB story, `MySqlFieldInfo` internals, the two `dispose()` test calls, and the README "does not parse connection strings" sentence. Only `src/adapter.ts:30` `Debug('prisma:driver-adapter:deno-mysql')` survives, as allowlisted. |
| 14 | Internal seam boundary               | `deno doc packages/prisma-adapter-mysql/mod.ts`; grep of both barrels; test import                                                     | Root surface = 13 symbols; `toMysql2PoolOptions`/`getCapabilities` absent from `mod.ts`, `src/mod.ts`, and `deno doc` root; test imports them from `../src/adapter.ts` only |
| 15 | Git/lock/path truth                  | `git diff --name-only cf648f1ff..067193acf`; `git diff --quiet … -- deno.lock`                                                          | 18 paths = 7 authored + 5 derivative files + 6 run artifacts; `deno.lock unchanged`                                        |
| 16 | Agent-docs prose freshness           | `deno task check:agent-docs-prose` (head-b)                                                                                            | `{"fresh":true,"stalePaths":[]}`, exit 0; corpus sha256 `beaff84f…184d8`, compressedBytes 1376347 = committed              |
| 17 | CLI assets-barrel freshness          | `deno task check:assets-barrel` (head-b) — **exit 129** because the task shells to `git diff` and an archive has no repo; proven instead by `cmp` of every regenerated barrel against `git show <head>:<path>` | all 7 barrel files IDENTICAL (`embedded`, `skills`, `agent-tools`, `agent-docs`, plugin `embedded`, `fresh-ui/registry`, `service/…/scalar`) |
| 18 | MCP export-corpus freshness          | `deno task check:mcp-export-corpus` (head-b); then `gen:` + `cmp`                                                                      | exit 0; `symbolCount: 7608`, sha256 `e598c091…`; regenerated file IDENTICAL to committed                                    |
| 19 | Publish-assets freshness             | `deno task check:publish-assets` (head-b); then `gen:` + `cmp`                                                                         | exit 0; regenerated `publish-assets.generated.ts` IDENTICAL to committed                                                   |

### Derivative regeneration — does each regenerate to the committed bytes?

| Artifact                                                                   | Method                                                                                                             | Result                                                                         |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `.llm/assets/agent-docs/prose.json.gz`                                     | `gen:agent-docs-prose` in a `git init`-ed head-b (the tool's line 351 needs `git rev-parse`); `zcat \| sha256sum` before/after | decompressed sha256 `beaff84f…184d8` identical; gzip bytes identical too       |
| `.llm/assets/agent-docs/provenance.json`                                   | `git diff` after gen                                                                                               | no diff                                                                        |
| `packages/cli/src/kernel/assets/agent-docs.generated.ts`                   | `gen:assets-barrel` then `git show <head>:path \| cmp - path`                                                      | IDENTICAL                                                                      |
| `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` | `gen:mcp-export-corpus` then `cmp`                                                                       | IDENTICAL (7608 symbols; `DenoMySqlClient`/`DenoMySqlConnection`/`ExecuteResult` absent) |
| `packages/mcp/src/publish-assets.generated.ts`                             | `gen:publish-assets` then `cmp`                                                                                    | IDENTICAL                                                                      |

Note on gate 16: the `--check` mode is not merely self-consistent — it rebuilds the Lume site,
re-extracts the corpus, gunzips the committed blob and byte-compares the decompressed content
(`build-agent-docs-bundle.ts:200`). A first attempt to run the full `gen:` in a git-less archive
crashed at `gitSourceCommit()` before writing, which would have made a naive "identical" verdict
vacuous; the git-initialised rerun above is the real regeneration proof.

### Is the cascade complete? — fifth-derivative hunt

- Every `check:`/`gen:` task in root `deno.json` was enumerated: the only generated-freshness
  checks are the four above plus `check:emitted-samples`, `check:scaffold-versions`,
  `check:streams-types`, `check:netscript-jsr-specifiers`, `check:aspire-host-ports`, none of which
  reads the site page or the package export surface. `check:assets-barrel` regenerates seven
  barrels, and all seven compare identical, so no sibling barrel is stale.
- `git grep` at head for the three removed symbol names hits only run artifacts and
  `.llm/tools/release/baselines/public-surfaces.json`. That file is the **release-time** API
  baseline (`rootVersion: 0.0.1-beta.8`, last touched by #740), consumed only by
  `.llm/tools/release/surface-diff.ts`; it is rewritten at release cut, not per PR, so it is not a
  fifth per-PR derivative. `docs/site/_data/xref.ts` names the package but no removed symbol.
- `deno task surface:diff` (observation-only in CI: `continue-on-error: true`, gated behind
  `surface-diff-gate`/`ci:full` labels) reports **531** undeclared majors at base and **535** at
  head. The leaf-caused delta is exactly `DenoMySqlClient`, `DenoMySqlConnection`,
  `ExecuteResult: symbol removed` and `PrismaMySqlResultSet: export signature changed` (D17). See
  A2.

Conclusion: the four-artifact cascade recorded at `067193acf` is complete. I agree with the
supervisor's ruling that the three regenerated `.generated.ts` files under `packages/` are
derivatives, not authored paths: each is produced verbatim by a checked-in `gen:` task from the
authored inputs, and each was confirmed byte-reproducible above.

## Is gate 5 load-bearing? — mutation probes (archive head-d, product restored after each)

| Probe                                                                           | Result                                                                                                                                        |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| M1 `prisma.$disconnect()` → `prisma.$disconnectt()`                              | `TS2551 Property '$disconnectt' does not exist on type 'PrismaClient<never, GlobalOmitConfig | undefined, DefaultArgs>'` — `prisma` is typed, not `any` |
| M2 `new PrismaClient({ adapter: await adapter.connect() })`                     | `TS2741 Property 'connect' is missing in type 'PrismaMySqlConnectedAdapter' but required in type 'SqlDriverAdapterFactory'`                    |
| M3 add `prisma.example.findMany({ where: { nope: 1 } })`                        | `TS2353 … 'nope' does not exist in type 'ExampleWhereInput'` — generated model types are live                                                |
| M4 `await main();` hoisted outside `import.meta.main`, `MYSQL_PORT=1`            | smoke exits 1 with a Prisma connection failure stack — the guard is the smoke's precondition, as the plan states                               |
| M5 revert D17 in `src/adapter.ts` (`columnTypes: number[]`)                      | `TS2322 Type 'PrismaMySqlAdapterFactory' is not assignable to type 'SqlDriverAdapterFactory'` — gate 5 catches the defect it exists for        |

Gate 1 was re-run after each cleanup (12 / 0 / 0) and `deno.lock` never changed.

## Plan-conformance checklist

| Check                                                                             | Result | Evidence                                                                                                                                               |
| --------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Plan-Gate: PLAN-EVAL run before implementation, two cycles, then owner ruling    | PASS   | PR comments `5452181794` (cycle 1 `FAIL_PLAN`) and `5454993523` (cycle 2 terminal `FAIL_PLAN`); artifacts on `eval/plan-eval-1711-cycle1` `5b58738ab` and `eval/plan-eval-1711-cycle-2` `60cf79ee5`; owner amendment recorded in `drift.md`/`worklog.md`; implementation granted at plan head `6ae7113eb` |
| Design checkpoint in worklog                                                      | PASS   | `worklog.md` `## Design` with Public Surface / Domain Vocabulary / Ports / Constants / Commit Slices / Deferred Scope / Contributor Path                |
| Commit slices follow the plan (2 slices)                                          | PASS   | `69f4ab932` (slice 1: adapter/types/tests) and `30cc8d084` (slice 2: mod/README/example/site), each with a PR comment; Tier-A `PASS` at `30cc8d084`  |
| Each slice's named gate passes                                                    | PASS   | re-derived table above                                                                                                                                 |
| Seven authored paths, no eighth                                                   | PASS   | gate 15                                                                                                                                                |
| Locked decisions D3 (literal dynamic import), D9 (deletions), D12 (deprecate TLS), D17 (inline union) | PASS | example line 24; `src/mod.ts` diff; `src/types.ts` `@deprecated` block; `src/adapter.ts:491`                                          |
| Settled decisions not re-litigated                                                | —      | literal dynamic import, inline union, two-cycle PLAN-EVAL: accepted as given                                                                           |
| Doctrine: no new port/adapter/runtime state; source-only seam                     | PASS   | `toMysql2PoolOptions` exported from `src/adapter.ts` only; gate 14                                                                                    |
| Architecture debt delta                                                           | PASS   | `git diff --stat base..head -- .llm/harness/debt/arch-debt.md` empty; plan's debt section says none accepted; `quality:gate` shows no new package finding |
| Breaking public-surface removal disclosed                                         | PASS   | PR body `## Breaking public-surface change` names all three symbols, the 7611→7608 delta, and the no-consumer claim; plan D9 + risk-register row 290 put the obligation on the PR/handoff, which is met. Independent consumer check: `grep -rn "DenoMySqlClient\|DenoMySqlConnection\|ExecuteResult" packages plugins docs` hits only the package's own `Mysql2ExecuteResult` and the test's `FakeExecuteResult`. |
| Close-gate (rule 12)                                                              | n/a yet | PR is draft/`status:impl`; issue #1112 acceptance boxes are all unchecked and the PR carries a five-entry `acceptance-evidence` block for the mirror at ready time (A3) |
| Release-gate class (rule 14)                                                      | n/a    | not a cut or release-gating run                                                                                                                        |

## Findings

No BLOCKING findings.

### A1 — ADVISORY — PR body over-states where the breaking removal is recorded

The PR's breaking-change section says the removal is "recorded in `drift.md`". `drift.md` carries
only the 2026-08-29 sequencing entry ("Public legacy-type deletion landed with its barrel update"),
which describes slice ordering; it does not name the three symbols as a breaking public-surface
change, the 7611→7608 corpus delta, or the no-consumer check. The disclosure itself is adequate in
the PR body and in plan D9 / risk row 290, so this is a wording/record gap, not a scope gap. A
one-entry `drift.md` addition would make the PR sentence true; it is a run artifact, not an eighth
product path. Not implemented by this evaluator.

### A2 — ADVISORY — `surface:diff` counts four leaf-caused majors, the PR discloses three as breaking

`deno task surface:diff` (head-c vs base-a control) attributes four new undeclared majors to this
leaf: the three removals plus `PrismaMySqlResultSet: export signature changed` (the D17 narrowing
from `number[]` to the closed `ColumnType` union). The PR discloses D17 as "type-only" under "What
changed", not under the breaking section. For a consumer that *produces* `PrismaMySqlResultSet`,
the narrowing is breaking; for consumers that read it, it is not. The classifier is observation-only
(531 pre-existing majors at base, `continue-on-error`, `surface-major-declarations.json` is empty
repo-wide), so nothing is gated on this. Worth one sentence in the breaking section.

### A3 — ADVISORY — stale phase/label state (not touched by this evaluator)

- PR body `## Harness` footer still says `Phase: IMPL-EVAL complete · PASS_IMPL`, which the same
  body's "Evaluation status" section contradicts ("cycle 1 no longer covers it").
- Issue #1112 is still `status:plan` with all five acceptance boxes unchecked, while the PR is
  `status:impl`. The close-gate mirror runs at ready time, so this is not blocking in draft.
- PR comment `5464909185` dispatched an OpenHands IMPL-EVAL pinned to the stale head `bbaf70d64`;
  it was cancelled (`OPENHANDS_VERDICT: NONE`, workflow failure). It produced no verdict on any head
  and does not conflict with this evaluation.

### A4 — ADVISORY — cycle-1 A2 second half remains

`bbaf70d64` fixed the example header (schema generator settings). The other half of cycle-1 A2 —
the site page imports `../../schema/.generated/client.server.ts` while the README imports
`./schema/.generated/client.server.ts` — is unchanged. Both are illustrative consumer-relative paths
and both name the NetScript generated-client shape per D3; not a defect.

### A5 — ADVISORY — evaluator deviations (disclosure, not leaf defects)

- Probe M4 executed `main()` once in archive `head-d` with `MYSQL_HOST=127.0.0.1 MYSQL_PORT=1`; the
  Prisma client attempted one TCP connection to a closed local port and failed. Nothing was started
  or listening; no MySQL was contacted. This is the only execution beyond the import-only smoke.
- `check:assets-barrel` cannot run in a tracked-files-only archive (its `git diff` step exits 129
  without a repo); gate 17 was therefore proven by regenerating and `cmp`-ing every barrel against
  the committed blob, which is a stronger statement than the task's own diff.
- `gen:agent-docs-prose` needs `git rev-parse` (`build-agent-docs-bundle.ts:351`); the byte-level
  prose proof used a `git init`-ed copy of the archive, still outside any repo checkout.

## What the evidence does not cover

- No live MySQL execution; runtime permissions are verified only up to module initialisation.
- The `verify_identity` deprecation is characterised by unit tests of the translator, not by a TLS
  handshake.

## Verdict

`PASS_IMPL` at `067193acff68254b4bd4c6e5d7824f80a9db2b26`. The evaluator changed no product, test,
docs, tooling, label, readiness, checkbox, lease, or PR state, and left no residue in any checkout
(`git status --porcelain` empty in the evaluator worktree; all archives live under the job tmp dir).
