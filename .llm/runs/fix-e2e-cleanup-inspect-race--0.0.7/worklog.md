# Worklog: cleanup container-inspect removal race

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-e2e-cleanup-inspect-race--0.0.7` |
| Branch | `fix/e2e-cleanup-inspect-race` |
| Archetype | `6 — CLI / Tooling` (parent package) |
| Scope overlays | `none` |

## Design

### Public Surface

- No `@netscript/cli` public export changes.
- `inspectAllContainers` becomes an export only from its internal evidence module so a colocated
  unit test can drive it; it is not re-exported from `packages/cli/mod.ts` or the E2E `mod.ts`.
- Archetype-6 spine abstracts (`CliCommand`, `CliCommandGroup`, `CliRoot`, `UseCase`, `Registry`),
  layer-2 abstracts, vertical feature catalog, extension registries, and composition roots are
  preserved unchanged.

### Domain Vocabulary

- `ContainerInspection` — containers successfully inspected plus ids that vanished during inspect.
- `vanishedContainerIds` — listed ids whose same-id inspect failure says `No such object`.

### Ports

- Injectable command runner on `inspectAllContainers` — deterministic unit seam for Docker list /
  inspect transcripts; no new package-level port or adapter.
- Existing process, filesystem, and wait edges remain unchanged.

### Constants

- No new finite domain constant is needed. Existing `OWNED_SURVIVOR_RETRY_WAITS_MS` is immutable
  and explicitly out of scope.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove listed-then-removed inspect is RED with an injected runner. | Durable focused test receipt must fail for the expected reason. | `cleanup.ts`, `cleanup_test.ts`, run artifacts |
| 2 | Classify same-id `No such object` as vanished, retain evidence, and prove other failures throw. | Focused cleanup tests pass. | `cleanup.ts`, `cleanup_test.ts`, run artifacts |
| 3 | Bind scoped static/runtime-schema/quality evidence to the final head. | Structured check/test/lint/fmt, version parity, quality gate, diff guards. | Run artifacts and receipts only |

### Deferred Scope

- Hosted Aspire runtime tiers — run in CI because the brief prohibits a local Aspire runtime.
- Existing cleanup retry timing and registry architecture debt — unrelated to this race.

### Contributor Path

Open `cleanup.ts` beside `cleanup_test.ts`; add a semantic command transcript fixture through the
injected runner, keep expected terminal states explicit, and preserve all other failures.

## Plan-Gate

`PLAN-EVAL: N/A` — issue #1977 and the implementation brief fully specify the failing transcript,
scope ceiling, additive receipt contract, budgets, tests, hosted-runtime proof, and PR metadata.
This is a small mechanical failure-boundary fix with no unresolved architecture decision.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-03T03:12:00Z | bootstrap | research/design | Re-baselined live issue #1977 and branch against exact `origin/main` `4afbd82a7`; locked plan. |
| 2026-09-03T03:15:35Z | S1 | RED | Durable `test` receipt failed as expected: 0 passed, 1 failed; the sole failure is `docker inspect 7ab8913455fa failed (1): Error: No such object: 7ab8913455fa`. |
| 2026-09-03T03:16:00Z | S1 | slice review | Diff is limited to the internal runner seam and desired semantic regression. No classification, receipt, wait, timeout, or budget behavior is changed in S1. |
| 2026-09-03T03:16:00Z | S1 | reconcile | Issue #1977 and draft PR #1979 are open at `status:impl`, milestone `0.0.7`, with the requested taxonomy. No new comments or scope readjustments. |
| 2026-09-03T03:17:00Z | S2 | GREEN | Structured focused wrapper passed 9/9 across the new colocated regression and existing Aspire cleanup-evidence tests. |
| 2026-09-03T03:17:00Z | S2 | slice review | Tightened the removal predicate from substring matching to an exact trimmed-line suffix for the current id; verified all other failures retain the original throw shape. Receipt change is additive and aggregates ids across probes. |
| 2026-09-03T03:17:00Z | S2 | reconcile | No new issue/PR comments or acceptance changes. Scope remains the two evidence files plus run artifacts; hosted tiers remain deferred to CI. |
| 2026-09-03T03:18:31Z | S2 | exact-head evidence | Durable focused test receipt passed 9/9 at `fdeeee1a06bd6698c6654bf95e0e0130991acafa`; `gitHead == actualGitHead`. |
| 2026-09-03T03:19:00Z | S3 | scoped static gates | Structured check/lint/fmt each selected and processed both touched files; zero failed batches, diagnostics, dropped files, or findings. |
| 2026-09-03T03:20:08Z | S3 | durable gates | At exact head `63282ffcc`: focused test 9/9 PASS, Aspire parity PASS (946 checked, 0 fail), and `quality:gate` PASS. |
| 2026-09-03T03:21:00Z | S3 | prohibited-delta guard | Product delta contains only `cleanup.ts` and `cleanup_test.ts`; no `deno.lock`, `.llm/tmp/pwcli/`, timeout, deadline, wait-array, `setTimeout`, or budget delta. |
| 2026-09-03T03:21:00Z | S3 | re-baseline/reconcile | Refreshed `origin/main` to `3903feea6`; its three new commits do not overlap the target surface. Issue/PR remain `status:impl`; no scope change. |
| 2026-09-03T03:44:00Z | hosted gates | initial exact-head CI | Both required hosted tiers passed at `d425207b0` in run `33711266536`: SQLite + Aspire + Garnet and Docker + PostgreSQL. |
| 2026-09-03T03:46:00Z | IMPL-EVAL cycle 1 | PASS with owner action | OpenHands `z-ai/glm-5.3-flash` returned `OPENHANDS_VERDICT: PASS` for product behavior, but found that the test's joined command literal trips `forbidden-commands_test.ts`; exact-head completion therefore remains open. |
| 2026-09-03T03:47:00Z | evaluator repair | GREEN | Changed the test transcript assertion from joined command strings to argv arrays. The repository teardown guard passes 1/1; focused cleanup tests pass 9/9; scoped check/lint/fmt are clean. No product behavior, receipt schema, or timing changed. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Add an internal runner seam | Reproduces the Docker TOCTOU race without a daemon. | issue #1977; A14 |
| Add only `docker.vanishedContainerIds` | Backward-compatible receipt evidence. | issue acceptance; plan D2 |
| Skip PLAN-EVAL | Complete mechanical contract with no open design choice. | harness run-loop §4 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Owner-selected high generator effort exceeds the normal small-fix route. | minor | yes |
| `origin/main` advanced by three unrelated commits during S3. | minor | yes |
| S3 did not include the repository teardown source-scan guard. | moderate | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| S1 RED | `run-gate.ts --gate test -- .../evidence/cleanup_test.ts` | FAIL_EXPECTED | Receipt exit 1, 0/1 pass/fail. |
| S2 focused GREEN | `run-gate.ts --gate test` over `cleanup_test.ts` and `aspire-cleanup-evidence_test.ts` | PASS | `receipts/s2-green.json`; 9 passed, 0 failed at `fdeeee1a0`. |
| scoped check | `run-deno-check.ts --file cleanup.ts --file cleanup_test.ts --ext ts` | PASS | 2 selected; 1 batch; 0 failed batches; 0 diagnostics. |
| scoped lint | `run-deno-lint.ts --file cleanup.ts --file cleanup_test.ts --ext ts` | PASS | 2 processed; no drops/refusals/findings. |
| scoped fmt | `run-deno-fmt.ts --file cleanup.ts --file cleanup_test.ts --ext ts` | PASS | 2 processed; no drops/refusals/findings. |
| S3 exact-head test | `run-gate.ts --gate test` over both cleanup test files | PASS | `receipts/s3-test.json`; 9/9 at `63282ffcc`. |
| Aspire version parity | `run-gate.ts --gate aspire-version-parity` | PASS | `receipts/s3-aspire-version-parity.json`; 946 checked, 0 failed. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-10 | PASS | `cleanup_test.ts`; `aspire-cleanup-evidence_test.ts`; `receipts/s3-test.json` | Small semantic tests; 9/9 pass. |
| A14 RED regression | PASS | `receipts/s1-red.json` | Receipt SHA-256 `f8e2d160...`; pre-fix file hashes `cleanup.ts` `b861a185...`, `cleanup_test.ts` `4f8ec1aa...`. Receipt correctly records the bootstrap HEAD and does not claim worktree cleanliness. |
| Archetype 6 structure | PASS | manual pre-change review | No public/composition/generated-output change planned. |
| `quality:gate` | PASS | `receipts/s3-quality-gate.json` | Quality scan + doctrine check exit 0 at `63282ffcc`; reported warnings are pre-existing and outside this two-file delta. |
| F-CLI-1…31 | PENDING_SCRIPT | manual post-change diff review + `quality:gate` | Archetype profile has no dedicated F-CLI scripts; no public surface, composition, registry, binary, generated output, or folder-over-cap change. |
| F-19 | PASS | scoped check/lint/fmt reports above | Exact two-file selection, no exclusions or drops. |
| shared-host teardown guard | PASS | `forbidden-commands_test.ts` after evaluator repair | 1/1 passed; regression now asserts argv arrays without embedding the forbidden bulk-teardown phrase. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| hosted scaffold runtime tiers | PASS_ON_PRIOR_HEAD | Actions run `33711266536` | Both required tiers passed at `d425207b0`; final repaired head must rerun in CI. Local Aspire runtime remains prohibited. |
| cleanup unit behavior | PASS | focused structured wrapper | Vanished and non-vanished failure paths covered. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| public CLI/scaffold output | N/A | scope review | No consumer-visible or generated-output change. |

### Prohibited-Delta Guard

| Check | Result | Evidence |
| --- | --- | --- |
| Product paths | PASS | Baseline name-status shows only `cleanup.ts` and new `cleanup_test.ts`. |
| Timing/budgets | PASS | Zero added/removed lines matching timeout, deadline, wait-array, `setTimeout`, or budget tokens. |
| Lock/pwcli | PASS | Baseline diff contains no `deno.lock` or `.llm/tmp/pwcli/` path. |

## Handoff Notes

- Evaluator should inspect the same-id error predicate, vanished-id aggregation, negative failure
  regression, prohibited-delta guard, and hosted tier evidence first.
- Local S1–S3 and the evaluator-requested test-only repair are complete. Hosted tiers and the
  separate OpenHands IMPL-EVAL must rerun at the repaired head before close-gate completion.
