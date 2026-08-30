# Evaluation: Aspire 13.5 S3 fixture re-capture (phase A) — IMPL-EVAL cycle 2

Allowed result values: `PASS`, `FAIL`, `N/A`, `PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`.
Anti-pattern status values: `CLEAR`, `VIOLATION`, `DEBT_ACCEPTED`, `N/A`.

## Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `test-aspire-13-5-s3-fixture-recapture--impl` |
| Target         | PR #1741 (draft) · issue #1715 · epic #1712 · phase A only |
| Evaluated head | `fe4f496bdcc605eceb9b3e5748ad55a7811bbed9` (`test/aspire-13-5-s3-fixture-recapture`; `git ls-remote origin` head equal; PR `headRefOid` equal). Base `origin/main` `13878a80a`. |
| Archetype      | N/A (test fixtures + repo tooling; no `packages/**` source changed) |
| Scope overlays | none |
| Evaluator      | Claude · Anthropic · Fable 5 · medium — separate native opposite-family session, worktree `/home/codex/repos/netscript-aspire-13-5-s3-eval` (detached at head), 2026-08-30. Generator: Codex · GPT-5.6 Sol. Cycle 1 (`evaluate.md`, head `a964a2120`) = `FAIL_FIX`; this cycle re-evaluates the whole phase-A contract at the slice-6 head. |

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate passed before implementation | PASS | `plan.md` S3-D4 records `PLAN-EVAL: N/A` with rationale (ratified issue, D-13, fixed slice list) before slice 1. |
| Design section exists in worklog | PASS | `worklog.md` `## Design` (Public Surface / Domain Vocabulary / Ports / Constants / Commit Slices / Deferred Scope / Contributor Path). |
| Commit slices match design plan | PASS | Six slices in the Design table ↔ six commits `c6afffd1a`, `b8b1c3b6f`, `2e4e3e785`, `37f0487f1`, `a964a2120`, `fe4f496bd` (parity RED → ps fixture → describe/banner → telemetry deferral → gates + #413 draft → evaluator fix). |
| Each slice has a passing gate | PASS | Worklog gate table rows per slice; receipts `01-parity-red.json`, `05-*`, `06-*`; every gate re-executed by the evaluator below. |
| Commit trail (push + per-slice comment) | PASS | PR #1741 comments `[SLICE: S1]`…`[SLICE: S6]` each with SHA + gates; remote head = `fe4f496bd`. |
| Brief carries `## SKILL` chapter | PASS | `slices/s3/brief.md` and `impl-eval-brief-cycle-2.md` each contain one `## SKILL` heading. |
| No speculative seams | PASS | Every added export (`ASPIRE_DESCRIBE_13_5_3_FIXTURE`) and fixture file is consumed by a test; no unused files in the diff. |
| Constants for finite vocabularies | PASS | `CompatFixtureState = 'required' \| 'pending-lease'` typed union + `COMPAT_FIXTURES` table in the parity test. |

## Cycle-1 findings — re-verification at `fe4f496bd`

| Cycle-1 finding | Status | Evidence |
| --- | --- | --- |
| H-1 retained 13.4.6 describe case reshaped; `resourceName` DCP-suffix fallback lost | FIXED | `git diff origin/main fe4f496bd -- packages/mcp/tests/service-endpoint-source-fixtures.ts` removes **0** lines; lines 1–22 (`ASPIRE_DESCRIBE_FIXTURE`) byte-identical to `origin/main` (`diff` → IDENTICAL). LCOV probe on `aspire-cli-endpoint-source.ts` from `service-endpoint-sources_test.ts`: base `DA:237,1 DA:239,1`; head `DA:237,1 DA:239,1` (fallback covered again; L238 `return undefined` uncovered on both, unchanged). |
| M-1 13.5.3 describe case = 13.4.6 data + synthetic banner with "captured live" claim | FIXED | `ASPIRE_DESCRIBE_13_5_3_FIXTURE` is now bannerless and is a projection of S2's `02-v5-aspire-describe-final.json` `users-yvbcumea` resource (name, displayName, resourceType, state, healthStatus, dashboardUrl, urls, volumes, healthReports, commands and OTEL/PORT env values match the receipt byte-for-byte; `DATABASE_URL`/`POSTGRES_URI` `REDACTED` as in the receipt; DCP cert dir → `aspire-dcp-REDACTED`). `generated-app-endpoint_test.ts` comment now says "redacted projection of `02-v5-aspire-describe-final.json`, selecting its `users` resource"; no "captured live" wording remains (`git grep 'captured from live' fe4f496bd -- packages/cli/e2e` → 0). |
| L-1 fixtures README fmt | FIXED | `deno fmt --check` on the three READMEs → `Checked 3 files`, exit 0. |
| L-2 omitted-key list | FIXED | `packages/mcp/tests/fixtures/README.md` names `creationTimestamp`, `startTimestamp`, `source`, `exitCode`, `stopTimestamp` as intentionally omitted. |

## Contract Verification (issue #1715 / D-13, phase A)

| Check | Result | Evidence |
| --- | --- | --- |
| Parity test covers every `compat-fixture` manifest row | PASS | `aspire-surface-manifest.tsv` (research branch) rows 129, 370, 397, 677, 680 = the five `COMPAT_FIXTURES` paths, exactly. |
| Parity RED on base | PASS | Head test file copied over a throwaway worktree at `13878a80a` → exit 1, failures = the four `required` rows "missing required 13.5.3 case"; matches `receipts/01-parity-red.json` (exit 1). |
| Parity green at head | PASS | `deno test --allow-read .llm/tools/validation/check-compat-fixtures_test.ts` → `ok \| 1 passed`. |
| `pending-lease` fails closed | PASS | Injected the literal `13.5.3` into `telemetry-live-fixture_test.ts` in a throwaway worktree at head → exit 1, `phase-B fixture landed; change pending-lease to required`; reverted. |
| `aspire-ps-13.5.3.json` byte-derived from S2 `02-v5-aspire-ps-final.json` | PASS | Same 7-key set/order; `sdkVersion: "13.5.3"`, `status`, `logFilePath` present; only `appHostPath`, `appHostPid`, `cliPid`, `dashboardUrl`, `logFilePath` value normalised to the 13.4.6 fixture conventions / `REDACTED`, exactly as the teardown README states. |
| Every fixture README states command, date 2026-08-29, CLI 13.5.3, receipt path | PASS | `packages/mcp/tests/fixtures/README.md`, `.llm/tools/agentic/teardown/__fixtures__/README.md`; telemetry README states the deferral. |
| No `*13.4.6*` file deleted or modified | PASS | `git diff --name-status origin/main fe4f496bd \| grep 13.4.6` → none. |
| 13.4.6 kept beside 13.5.3 in all five consumers | PASS | Removed-line diff base→head: `service-endpoint-source-fixtures.ts`, `service-endpoint-sources_test.ts`, `generated-app-endpoint_test.ts`, `service-env-evidence_test.ts`, `telemetry-live-fixture_test.ts` remove 0 lines. `probes_test.ts` folds the 13.4.6 test into `for (const aspireVersion of ['13.4.6','13.5.3'])` — body and both `assertEquals` blocks identical to the removed 13.4.6 test (same docker fixture, same stat/cmdline stubs); 13.4.6 still runs by name. |
| No adapter behaviour change | PASS | Diff touches no `packages/mcp/src`, no `packages/telemetry`, no `packages/fresh`. |
| No fabricated 13.5.3 telemetry envelope | PASS | `git ls-tree -r fe4f496bd \| grep 'aspire-13.5.3-(resources\|spans\|fixture)'` → none; research-branch `plan.md` grep for `resources.json\|spans.json\|envelope\|traceId\|spanId` → 0 hits; telemetry README states the deferral, the two exact `GET <dashboardUrl>/api/telemetry/{resources,spans}` requests, the health-check trigger, filenames, and the `pending-lease → required` promotion step. |
| Boundaries (no runtime/capture/pins/`packages/fresh`/skills/docs) | PASS | `git diff --name-only` filtered for `packages/fresh`, `packages/telemetry`, `.agents`, `.claude`, `docs/`, `deno.json`, `deno.lock` → empty. |

## Static Gates (executed by the evaluator at `fe4f496bd`)

| Gate | Command or check | Result | Evidence |
| --- | --- | --- | --- |
| Configured lint | `run-deno-lint.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)\|…)"` (the `deno task lint` command invoked directly — `deno task lint` itself returned "cached, inputs unchanged" and is not a receipt) | PASS | 2043/2043 processed, 0 findings, exit 0. |
| Scoped check | `run-deno-check.ts --root packages/mcp --root packages/telemetry --root .llm/tools/agentic/teardown --root packages/cli/e2e --root .llm/tools/validation` | PASS | 415 files, 4 batches, 0 diagnostics. |
| Scoped lint (`packages/cli/e2e`) | `run-deno-lint.ts --root packages/cli/e2e --exclude fixtures/` | PASS | 163/163, 0 findings. |
| Scoped lint (`.llm/tools/*`) | `run-deno-lint.ts --root .llm/tools/agentic/teardown --root .llm/tools/validation` | EXPECTED_REFUSAL (baseline) | exit 2 `processed-count-unavailable` — root config excludes `.llm`; identical refusal on `origin/main`. Fallback: `deno lint --no-config` on the 6 changed `.ts` files → 0 findings. |
| Scoped fmt | `run-deno-fmt.ts` on the same five roots | PASS | 414/414, 0 findings. |
| README fmt | `deno fmt --check` on the three fixture READMEs | PASS | `Checked 3 files`. |
| Hygiene | diff scan for `deno-lint-ignore`, `as unknown as`, `any` | PASS | 0 hits in added lines. |

## Fitness Gates

| Gate | Function | Result | Evidence |
| --- | --- | --- | --- |
| `quality:scan` | any/casting + hardcoded plugin names | PASS | `{"ok":true,…"findings":[],"allowCount":7}` — the 7 pre-existing allowances, none touched. |
| `arch:check` | doctrine fitness | PASS | exit 0; only pre-existing `export default` WARNs. |
| `check:mcp-export-corpus` | export surface invariant | PASS | exit 0, corpus sha `88011e6e…` unchanged. |
| F-1…F-19 | — | N/A | no `packages/**` source changed. |

## Runtime Gates

| Gate | Validation | Result | Evidence |
| --- | --- | --- | --- |
| Unit tests | `run-deno-test.ts -- --allow-all --unstable-kv packages/mcp/tests packages/telemetry .llm/tools/agentic/teardown check-compat-fixtures_test.ts generated-app-endpoint_test.ts service-env-evidence_test.ts` | PASS | 263 passed / 0 failed. |
| AppHost / capture | not run by design (no runtime lease in phase A) | N/A | phase B. |
| CI `deno task check` on generated project (#1734 baseline) | not evaluated | N/A | no CI gate red for that reason was observed in this pass; if one appears it is the `packages/fresh` hydration TS2345 baseline, not S3. |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| --- | --- | --- | --- |
| teardown probes | 13.4.6 + 13.5.3 `aspire ps` normalise identically | PASS | `probes_test.ts` loop, 2 cases green. |
| MCP `AspireCliEndpointSource` | parses bannerless 13.5.3 receipt shape | PASS | `service-endpoint-sources_test.ts` new case green; note it resolves `users` to `http://127.0.0.1:43515` (env `PORT`) rather than `urls[].url` `http://localhost:3001` — this is existing adapter precedence exercised on the real S2 data, not an S3 change. |
| CLI E2E `appUrlsFromDescribeOutput` / topology evidence | 13.5.3 cases | PASS | both new tests green. |

## Anti-Pattern Check

| AP | Status | Evidence |
| --- | --- | --- |
| AP-1…AP-25 | N/A | no framework-layer code in scope; `quality:scan`/`arch:check` clean as a guard. |

## Arch-Debt Delta

| Metric | Count | Evidence |
| --- | --- | --- |
| New / resolved / deepened / unrecorded | 0 / 0 / 0 / 0 | `git diff origin/main fe4f496bd -- .llm/harness/debt/arch-debt.md` empty; `drift.md` records the phase-B deferral (minor). |

## Findings

| Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| low (info) | `service-env-evidence_test.ts` 13.5.3 case reuses the existing `healthyResource()` data with an empty banner — it is a shape test (bannerless, object env), not a receipt projection. The comment states this honestly ("captured with `--nologo`; environment is object-shaped"); no capture claim is made. | diff added lines | none required; optional: project the S2 `users` env into it in phase B for symmetry. |
| low (info) | Describe README says nested properties/environment are "trimmed" but does not mention that the receipt's three duplicate `Reference` relationships were collapsed to one and `resource.appArgs` shortened. | S2 receipt vs fixture | optional one-clause README addition; not blocking. |
| info | Issue #1715 acceptance checkboxes are all unchecked. Correct for a draft awaiting phase B; the close-gate must be satisfied (boxes checked with linked evidence) before draft→ready / merge. | `gh issue view 1715` | phase-B/ready step, not phase A. |
| info | `run-deno-lint.ts` refuses `.llm/tools/*` roots (root config excludes `.llm`) on base and head alike; the run's raw `deno lint --no-config` fallback is the correct evidence. | evaluator run | none. |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| --- | --- | --- | --- |
| Inline compat cases need a removed-line diff + coverage probe, not a filename check | `git diff base head -- <file> \| grep '^-'` must be empty for a "kept verbatim" contract; LCOV on the adapter lines the old case proved | compat-fixture slices | high |

## Verdict

| Field | Value |
| --- | --- |
| Verdict | `PASS` |
| Rationale | All four cycle-1 findings are fixed at `fe4f496bd` with executed evidence: the 13.4.6 describe literal is byte-identical to `origin/main` and the `resourceName` fallback lines are covered again (LCOV base = head); the 13.5.3 describe case is a bannerless, honestly-labelled projection of S2's receipt; READMEs are formatted and list the omitted keys. The phase-A contract holds end to end: parity covers all five manifest rows, RED on base / green at head / fails closed on a premature phase-B literal (all reproduced independently); the `ps` fixture is byte-derived from S2 with only the documented normalisation; no 13.4.6 file or inline case lost; no adapter change; no fabricated telemetry envelope anywhere including the research-branch plan; every gate green (lint 2043/0, check 415/0, tests 263/263, fmt 414/0, quality:scan 0, arch:check 0, export corpus unchanged); PR trail, labels, milestone 0.0.7, `Closes #1715` / `Part of #1712`, phase-B stated. Phase A is complete and correct; the PR may stay draft awaiting the lease-backed phase B. |
