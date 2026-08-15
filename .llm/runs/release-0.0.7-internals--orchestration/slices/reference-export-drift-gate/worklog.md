# Worklog — reference-export-drift-gate

## S1 — explicit coverage and reference reconciliation

- Authorization: PLAN-EVAL cycle 2 `PASS` at evaluator commit `45c249b9c`, evaluated over SA-2 head
  `80046696e`.
- Scope: S1 only. S2 and S3 were not started.
- Commit: the S1 commit containing this artifact; the pushed SHA is recorded in the structured PR
  comment.

### Implementation

- Replaced boolean `checkSymbols`/`excludedSymbols` state with a discriminated, reason-bearing
  `symbolCoverage` policy.
- Added fail-closed runtime policy validation, sorted exact omission groups, stale-omission checks,
  and explicit documented-non-export checks.
- Added an exported injectable `checkDrift(mapping): Promise<number>` seam and bound process status
  only under `if (import.meta.main)`.
- Restricted symbol parsing to tables whose first trimmed header cell is exactly `Symbol`; prop,
  field, shape, and category tables no longer enter the inventory. Display generic suffixes such as
  `<T>` normalize to the exported name.
- Promoted Fresh UI to complete coverage across all six entrypoints. Its policy excludes no exported
  symbols. The only allowed doc-only names are seven Dropzone copy-source contracts, grouped with
  the same reason as the page's explicit non-export label.
- Repaired the Fresh UI reference for ActionMenu, Combobox, all public interactive contracts,
  desktop chrome, registry contracts, render-UI types, DataGrid contexts, and the maintainer
  derivation/update runbook.
- Corrected exactly the four authorized Contracts `@example` import subpath lines. No runtime, type,
  export, or schema line changed.

### N1 / D11 evidence

The checker was not tuned quiet:

1. After policy/parser implementation but before reference reconciliation, the direct checker
   returned raw exit 1 with the real Fresh UI omissions plus unsorted policy groups. It reported no
   parser-generated inventions.
2. After documenting the live Fresh UI surface, the checker returned raw exit 1 for only the
   inherited Telemetry omission group's unsorted order. The group was sorted mechanically without
   changing its 154-symbol membership.
3. The final direct checker returned raw exit 0. Fresh UI measured 168 expected exports and 175
   documented inventory names: zero omissions and exactly the seven explicitly classified Dropzone
   non-exports. No exported Fresh UI symbol is omitted by policy.

### Evidence

| Proof                                               | Result                                                                                                    |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Structured check wrapper on checker + checker test  | raw exit 0; 2 files selected, 0 findings                                                                  |
| Structured focused-test wrapper                     | raw exit 0; 6 passed, 0 failed                                                                            |
| Structured lint wrapper                             | raw exit 0; 6 TypeScript files selected, 0 findings                                                       |
| Structured format wrapper                           | raw exit 0; all 10 changed files selected, 0 findings                                                     |
| Four refusal cases                                  | empty/malformed reason, unknown mode, invented symbol, omitted symbol each asserted return code 1         |
| Direct exports/symbol drift                         | raw exit 0; eight per-package mode/reason/group reports; terminal PASS                                    |
| Fresh UI live inventory diagnostic                  | raw exit 0; expected 168, documented 175, omissions 0, inventions exactly seven classified Dropzone names |
| Docs source format                                  | raw exit 0; `Docs source format: OK`                                                                      |
| `deno task docs:accuracy`                           | raw exit 0; terminal `docs accuracy: PASS`                                                                |
| Six affected Contracts symbols on ruled entrypoints | raw exit 0 each via `deno doc --no-lock --filter`                                                         |
| Contracts JSDoc diff                                | exactly one import-subpath line in each of four authorized files                                          |
| Contracts full-export `doc:lint`                    | raw exit 1; unchanged baseline nine `private-type-ref` diagnostics, zero on `/query` and `/transform`     |
| Thirteen-path audit                                 | raw exit 0; seven approved S1 implementation paths plus three slice artifacts, no unauthorized path       |
| `fresh-browser`                                     | `NOT_RUN` — N/A / waived; no runtime lease                                                                |

No Aspire, Docker, browser, `e2e:cli`, scaffold/runtime smoke, publish, S2 task/workflow wiring, or
S3 durable gate receipt was fired.

## S2 — named discoverability paths

- Authorization: coordinator S1 slice-review `PASS` at `678840603`.
- Scope: S2 only. S3 was not started.
- Commit: the S2 commit containing this amendment; the pushed SHA is recorded in the structured PR
  comment.

### Implementation

- Added `docs:exports-drift` as a directly invocable task with only `--allow-read` and
  `--allow-run=deno`. The checker does not receive environment, write, network, or broad
  `--allow-all` permission.
- Replaced the accuracy checker's hidden raw-script argv with one `deno task docs:exports-drift`
  child invocation. Existing nonzero handling remains intact: the child's stdout and stderr are
  surfaced before the aggregate throws.
- Added one explicitly named Pages build step that runs `deno task docs:exports-drift` from the
  repository root, behind `if: env.RUN == 'true'` and without `working-directory`.
- This is a discoverability repair over the pre-existing fail-closed non-draft CI enforcement chain;
  it does not claim S2 created enforcement.

### Evidence

| Proof                           | Result                                                                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Explicit wiring search          | raw exit 0; one task definition, one aggregate call, one Pages command                                                                                             |
| Named `docs:exports-drift` task | raw exit 0 before and after the negative diagnostic; terminal PASS                                                                                                 |
| `deno task docs:accuracy`       | raw exit 0; terminal `docs accuracy: PASS`                                                                                                                         |
| Single-execution audit          | raw exit 0; maintenance reaches drift only through one accuracy call, accuracy calls the task once, and Pages calls the task once without also calling accuracy    |
| Permission audit                | raw exit 0; task text exactly matches `--allow-read --allow-run=deno` and no broader permission                                                                    |
| Pages trigger/guard/root audit  | raw exit 0; pre-`jobs` workflow prefix byte-identical to S1 HEAD, guard present, no working directory                                                              |
| Pages workflow structural test  | raw exit 0; 1 passed, 0 failed                                                                                                                                     |
| CI classifier/workflow test     | raw exit 0; 60 passed, 0 failed                                                                                                                                    |
| Docs source-format gate         | raw exit 0; `Docs source format: OK`                                                                                                                               |
| Docs source-format tests        | raw exit 0; 6 passed, 0 failed                                                                                                                                     |
| Structured check wrapper        | raw exit 0; one file selected, no findings                                                                                                                         |
| Structured format wrapper       | raw exit 0; all six changed files selected, no findings                                                                                                            |
| Controlled named-task drift     | raw child exit 1; surfaced invented and omitted ActionMenu names                                                                                                   |
| Controlled aggregate drift      | raw child exit 1; surfaced child output and threw fail-closed                                                                                                      |
| Controlled-drift restoration    | raw diagnostic exit 0; SHA-256 before/after `e822e8503636fd9f99ae816172baab0815d034f3fe745f9c58f10e9293b34db`, byte-exact, scratch removed, target diff raw exit 0 |
| Thirteen-path audit             | raw exit 0; three approved S2 implementation paths plus three slice artifacts, no unauthorized or forbidden path                                                   |
| `fresh-browser`                 | `NOT_RUN` — N/A / waived; no runtime lease                                                                                                                         |

One extra structured lint probe returned raw exit 2 because Deno excluded the `.llm` file under the
repository lint configuration; the wrapper correctly refused an empty selection instead of claiming
green. A diagnostic `deno lint --no-config` on that exact file returned raw exit 0. The first
single-execution assertion probe also returned raw exit 1 because its shell-embedded YAML quote was
stripped; the corrected character-code assertion returned raw exit 0 with every count, guard,
permission, and trigger check true. Neither diagnostic red is treated as a product verdict.

No Aspire, Docker, browser, `e2e:cli`, scaffold/runtime smoke, publish, S3 durable gate receipt,
workflow trigger, `deno.lock`, central state, or other lane was touched.

## Handoff

S2 stops after commit, explicit-refspec push, and its structured PR comment. The coordinator owns
the required substantive slice review. S3 must not begin until that review authorizes continuation.

## S3 — history-bound contract and publication evidence

- Authorization: coordinator S2 slice-review `PASS` at `47ca22abe`.
- Scope: run artifacts only; no implementation-path edit.
- Immutable implementation head: `47ca22abe94b9d2e54d3778edc8944094b227886`.

### Durable gate set

Seven `run-gate.ts` receipts under `receipts/s3/` attest the exact immutable head. The generated
evidence-set report is `SUFFICIENT` with no reasons.

| Gate                 | Raw exit | Result                                              |
| -------------------- | -------: | --------------------------------------------------- |
| `check`              |        0 | PASS; 2,924 selected files, 25 batches, 0 findings  |
| `test`               |        0 | PASS; 4,203 passed, 0 failed, 19 ignored            |
| `quality-job`        |        0 | PASS; dependency-catalog warnings retained          |
| `arch-check`         |        0 | PASS; existing doctrine WARN/INFO findings retained |
| `docs-source-format` |        0 | PASS from `docs/site` cwd                           |
| `docs-accuracy`      |        0 | PASS; existing TanStack peer warning retained       |
| `publish-dry-run`    |        0 | PASS; static workspace simulation only              |

### Focused and JSR evidence

- Direct named drift: raw exit 0, all eight coverage reports, terminal PASS.
- Focused checker test: raw exit 0, 6 passed / 0 failed.
- Contracts JSR audit: raw exit 0; all four edited JSDoc files present in the publish set; one
  sanctioned oRPC slow-type INFO.
- Fresh UI JSR audit: raw exit 0; all six exports inspected; existing structural/cardinality and
  slow-type WARN findings preserved.
- Exact pins: Contracts has zero `@netscript/*` member imports; Fresh UI has exactly two, both fixed
  to `jsr:@netscript/sdk@0.0.6/...`. `deps:why @netscript/sdk` raw exit 0 confirms live use.
- Contracts full-export doc lint: **raw exit 1, RED**; unchanged 9 private-type-ref diagnostics,
  with `/query` and `/transform` clean.
- Fresh UI full-export doc lint: **raw exit 1, RED**; unchanged 123 `/interactive` diagnostics (96
  private-type-ref, 27 missing-jsdoc), with the other five entrypoints clean.

### History and boundary evidence

- Thirteen-path classifier: raw exit 0; 10 changed implementation paths, all authorized; every other
  changed/pending path is within this run directory.
- Forbidden-surface direct Git diff: raw exit 0.
- `deno.lock` base, immutable-head, and working-tree blob IDs are identical:
  `a1522e6ecc98dd4232312385b0cea4e52f5fa4b2`.
- `run-gate.ts --help` was an unsupported tooling probe (raw exit 1); no gate fired. Valid gates
  were launched only after reading the source contract/catalog.
- `fresh-browser` remains `NOT_RUN`, N/A / waived. No runtime lease exists or was requested.
- All prohibited runtime, publish, merge, readiness, label, issue, milestone, cluster, and cleanup
  actions remain `NOT FIRED`.

## Final author handoff

S3 stops after the run-artifact commit, explicit-refspec push, and structured PR comment. The
coordinator owns final substantive review, IMPL-EVAL, readiness, and merge. The author does not
self-certify.

## FAIL_FIX repair — discriminating refusal tests

- Authorization: evaluator F1 at `4c09e9203`; test-quality repair only.
- Immutable repaired implementation head: `4238670173271bca4281eba7db6c2030d046bc73`.
- Repair scope: exactly `.llm/tools/docs/check-exports-drift_test.ts`; checker behavior and every
  product/docs/task/workflow path remained unchanged.
- The four refusal tests now use real fixture paths and require the branch-specific captured error.
  The invented case documents `actualSymbol` plus `inventedSymbol`, preventing OMITS from masking
  INVENTS.
- Full-repository archive mutation tests returned raw exit 1 for each named INVENTS, unknown-mode,
  malformed-reason, and OMITS test; the restored six-test suite returned raw exit 0.
- Seven authoritative receipts under `receipts/fix1/` all returned PASS/raw exit 0 and attest the
  repaired head. `audit/evidence-set-fix1.json` is `SUFFICIENT` with no reasons.
- The preliminary full-test receipt remains RED/raw exit 1 because the safety test inspected the
  run-owned mutation archive; after explicit scratch cleanup, attempt 2 passed 4,203/0/19.
- The five issue boxes map separately to Contracts example imports, Contracts reference inventory,
  Fresh UI reference truth, machine-readable omissions, and runbook/discoverable verification. No
  box, acceptance-evidence block, or issue state was mutated.
- Design checkpoint: the locked D1-D11 table in `plan.md` plus PLAN-EVAL cycle-2 PASS at `45c249b9c`
  is the recorded design checkpoint.
- `fresh-browser` remains `NOT_RUN`, N/A / waived. All prohibited runtime and publication actions
  remain `NOT FIRED`.

The detailed mutation record and receipt/red accounting are in `audit/refusal-mutation-tests.md` and
`fix1-evidence.md`. The author stops after the explicit-refspec push and structured repair comment
for coordinator Tier-A.

## SA-3 plan-only amendment — agent-docs publication cascade

- Trigger: quality CI at `ee67d12b4` found `Agent docs corpus freshness` red. The close-gate red is
  a coordinator-owned label/mirror race and was not rerun. The preserved IMPL-EVAL PASS remains
  append-only pre-finding evidence; readiness is revoked and PR #1666 remains draft/status:impl.
- No generator ran against the author checkout. All causal probes ran in isolated clones under
  `.llm/tmp/` at exact leaf head and exact base.
- Leaf/base control: `check:agent-docs-prose` raw exit 1 at `ee67d12b4`, raw exit 0 at `baf1cdf67`.
  `check:mcp-export-corpus` raw exit 1 at both commits.
- Serial scratch generation found exactly four affected paths: agent-docs gzip, provenance, CLI
  agent-docs generated source, and MCP publish-assets generated source. All applicable generator raw
  exits were 0; a second pass left the cumulative diff checksum unchanged.
- Exclusion proof: base and leaf `gen:mcp-export-corpus` outputs are byte-identical SHA-256
  `314c9946631c8db0e500ed0cf389ddc3dd66badaedb5b6643b3b9ab9453c71f6`; its freshness red is baseline
  drift and its generated path is not authorized.
- Scope: SA-3 grants only the four verified generated paths, taking the implementation ceiling from
  thirteen to seventeen. An eighteenth path is rescope. No generated file is hand-edited.
- Publish correction: the CLI asset contains refreshed offline prose and provenance; MCP's bounded
  prose excludes Fresh UI but its published provenance advances. Both are real JSR publish deltas.
- Next action is blocked on fresh Tier-A PASS. Only then may the canonical three-generator sequence,
  idempotence proof, coherent content-head receipt recut, explicit-refspec push, and second Tier-A
  occur. Fresh delta IMPL-EVAL remains coordinator-owned and required before readiness.
- `fresh-browser` stays N/A/waived and `NOT_RUN`; runtime, close-gate, label, issue-box,
  draft-state, merge, publish, lock, and central-state mutations remain `NOT FIRED`.

## SA-4 canonical generation and coherent content-head evidence

- Fresh Tier-A passed SA-3 at `f98cfabac`; canonical generation then ran in locked D12 order.
- The first fully observed and second idempotence passes returned raw exit 0 for all three owners.
  Both produced exactly the four approved outputs and the same binary diff SHA-256
  `a47278e3c07b2c31358ca2e5d1fbdf9f5539e265e280848b875b9ab6984ae9bc`.
- Generated content was committed alone at `46528ae4c71b3744f0af64bd749d01d831f70c89`. A clean-head
  third owner pass returned raw exit 0 for all three generators and left no diff.
- Twelve receipts were recut at that one immutable head. Eleven are PASS/raw 0. Full `test` is
  honestly RED/raw 1 because a repository safety test found a forbidden command in foreign
  `.llm/tmp/claude/hooks/unscoped/events.jsonl`; 4,202 tests passed, 1 failed, and 19 were ignored.
  The evidence-set result is therefore `INSUFFICIENT`, not relabeled green.
- Focused drift/checker/Pages checks are green. `check:mcp-export-corpus` remains the recorded
  baseline RED/raw 1 without generation. Contracts and Fresh UI doc-lint remain RED/raw 1 at 9 and
  123 findings respectively.
- Four JSR audits returned raw 0; exact internal pin counts are Contracts 0, Fresh UI 2, CLI 6, MCP
  3, all present pins exact `0.0.6`. CLI and MCP member dry-runs selected their regenerated publish
  files explicitly.
- Seventeen-path classifier, forbidden-surface audit, and lock proof returned raw 0. Fourteen
  implementation paths changed, all authorized; the lock blob remains
  `a1522e6ecc98dd4232312385b0cea4e52f5fa4b2`.
- Close-gate and all runtime/prohibited actions remain `NOT_RUN` / `NOT FIRED`. The author stops
  after the run-artifact commit, explicit-refspec push, and structured comment for fresh Tier-A.

## SA-4 test attempt 2 — supervisor-attributed temp transcript

- The supervisor attributed the sole original test red to ignored temp hook transcript
  `.llm/tmp/claude/hooks/unscoped/events.jsonl`, line 177, timestamp `2026-08-15T19:11:51.339Z`,
  `sessionId: null`. It is the supervisor's unscoped capture of supervisor prose quoting the
  forbidden string, not generated product or tracked source.
- The supervisor moved the exact subtree recoverably to
  `/home/codex/.claude/jobs/f7691917/quarantine/sa4-hooks-unscoped/`. Pre- and post-move SHA-256 are
  both `d0251bc2f8c78814724cb2e6c2460102260a39aadb3a21551b81244efbaceab2`; the destination retains
  262,354 bytes, 180 lines, and mtime `2026-08-15 21:12:52 +0200`.
- The original red receipt remains byte-unchanged: raw exit 1, 4,202 passed / 1 failed / 19 ignored
  (4,222 total), SHA-256 `2715babef54414d6b30a89e31487088dec4c446ad9b4efc5ee769e9fc59262f7`.
- Exactly one distinct attempt ran at detached immutable content head
  `46528ae4c71b3744f0af64bd749d01d831f70c89`, invocation `reference-export-sa4-test-attempt2`. It
  returned raw exit 0: 4,203 passed / 0 failed / 19 ignored, 4,222 total.
- The authoritative twelve-gate evidence set now selects attempt 2 and recomputes `SUFFICIENT`; both
  test receipts remain in the evidence index with exact totals. No third attempt ran.
- No scanner, product/source/generated path, lock, runtime, close-gate, PR state, label, or issue
  state changed.
