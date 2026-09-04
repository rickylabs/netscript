# Worklog: agent model routing and subscription expense policy revamp

## Run Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `chore-revamp-agent-model-routing--model-matrix` |
| Branch         | `chore/revamp-agent-model-routing`               |
| Archetype      | `6 - CLI / Tooling`                              |
| Scope overlays | docs                                             |

## Design

### Surface

The change is internal harness tooling. `config/models.ts` remains the only model-string authority.
A typed workload/coordinator matrix becomes the only active role-to-model authority.
`provider-profiles.ts` remains the provider boundary, extended for OpenCode Go and Ollama. A new
pure expense-watcher boundary evaluates normalized usage before a paid OpenCode process can spawn.

### Data flow

```text
workload tier + role
        ↓
owner matrix cell ── composes a different-family evaluator for the selected generator
        ↓
logical model + effort + evaluation policy
        ↓
provider preference + capability + health + fresh allowance snapshot
        ↓
concrete CLI/provider/model route
        ↓
provider-specific secret loader (key value never leaves child environment)
        ↓
bounded launch + structured receipt
```

### Error contract

- Unsupported model/provider capability: deterministic policy error, select declared fallback.
- Missing/stale/malformed usage: `usage_unproven`, fail closed before spend.
- Allowance exhausted: exact window(s) and remaining amount in structured output; no secret data.
- Unknown Ollama tier: `subscription_tier_unresolved`, fail closed.
- Same-family evaluator composition: construction/selection error, never launch.
- Missing credential: provider/key name only, never source content or value.

### Contributor path

To add or retire a model: edit the model catalog and capability records, then the matrix cell if
role assignment changes. Update official limit metadata only in subscription config. The exhaustive
tests and documentation parity gate identify every required downstream update.

## Progress Log

| Time                 | Slice     | Step             | Notes                                                                                                                                                                                |
| -------------------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-09-04T13:58:23Z | bootstrap | activated        | Read owner matrix first; selected Archetype 6 plus docs overlay; created isolated run.                                                                                               |
| 2026-09-04T13:59:30Z | bootstrap | draft PR         | Pushed `f16ae59a5`; opened draft PR #1989.                                                                                                                                           |
| 2026-09-04T14:00Z    | research  | provider facts   | Re-derived Astra, OpenCode Go, Ollama, provider catalog, current code surfaces, and limits from official/live sources.                                                               |
| 2026-09-04T14:20Z    | design    | locked           | Chose typed matrix, logical/provider model split, exhaustive cross-family validation, and pre-spend fail-closed watcher.                                                             |
| 2026-09-04T16:22Z    | PLAN-EVAL | cycle 1          | Muse Spark was rejected before a turn by the current OpenRouter privacy setting; declared Grok 4.6 xhigh fallback returned `FAIL_PLAN`.                                              |
| 2026-09-04T16:24Z    | design    | bounded repair   | Locked vendor-level family composition, exact per-tier evaluation limits, and fail-closed legacy-lane behavior.                                                                      |
| 2026-09-04T16:29Z    | PLAN-EVAL | cycle 2          | Same OpenCode session `ses_f9338f842ffeT0E2CjAp7yu3KZ`, Grok 4.6 xhigh, returned `PASS` at repair head `372409ab6`.                                                                  |
| 2026-09-04T16:38Z    | S1        | implemented      | Added volatile model slugs, vendor-family catalog, five workload tiers, four coordinator tiers, exact eval policies, fallback composition, and fail-closed legacy lanes.             |
| 2026-09-04T16:49Z    | S2        | implemented      | Replaced the flat resolver with matrix-derived workload/coordinator resolution, provider precedence, selected-family skipping, and explicit legacy rejection.                        |
| 2026-09-04T14:47Z    | S3        | implemented      | Added OpenCode Go/Ollama/OpenRouter credential isolation, paid-route provider profiles, fail-closed structured subscription expense decisions, and CLI preflight.                    |
| 2026-09-04T14:57Z    | S4        | implemented      | Replaced stale named-lane prose with workload/coordinator matrix policy across active harness, evaluator, manager, remote, OpenHands, docs-audit, and tooling surfaces.              |
| 2026-09-04T15:10Z    | S5        | live/gates       | Proved all three auth registrations, live Go/Ollama/OpenRouter catalogs, corrected three nonexistent Ollama capabilities, and completed one guarded OpenCode Go turn.                |
| 2026-09-04T15:25Z    | IMPL-EVAL | cycle 1          | Separate OpenCode Go / Grok 4.6 xhigh session `ses_f93062116ffe1eRZWsVs5ukzqK` returned `FAIL_FIX` at `9f8ee61a6` with five bounded findings.                                        |
| 2026-09-04T15:32Z    | repair    | implemented      | Corrected native Claude and dated Ollama dispatch ids, added the pre-spawn expense-denial seam/test, and replaced the stale README resolver claim.                                   |
| 2026-09-04T15:32Z    | reconcile | live review      | Reconciled owner live-substrate comments: Astra remains active as instructed; paid training remains eligible; external CLI/desktop toolchain is current.                             |
| 2026-09-04T15:52Z    | IMPL-EVAL | cycle 2          | Same evaluator session passed via Grok 4.6 xhigh on the OpenRouter provider fallback after two Go transport stalls; all five findings independently closed.                          |
| 2026-09-04T15:53Z    | reconcile | provider state   | Owner enabled both OpenCode provider settings, so contributor-training and China-hosted routes are eligible for subsequent dispatches.                                               |
| 2026-09-04T16:00Z    | reconcile | cost trace       | Owner dashboard tied about $3.13 of Go/Grok spend to `Vs5ukzqK`; traced exactly to IMPL-EVAL session `ses_f93062116ffe1eRZWsVs5ukzqK`, incorrectly briefed as architecture/xhigh.    |
| 2026-09-04T16:03Z    | repair    | owner ruling     | Locked `complex`/`architecture` as privileged rows: only explicit owner or milestone-coordinator authority plus a recorded rationale may select them.                                |
| 2026-09-04T16:06Z    | repair    | live expense     | Replaced caller-provided Go usage with authenticated live percentage windows and model-weighted limits; real no-spawn smoke returned exit 4 / `provider_rate_limited`.               |
| 2026-09-04T16:09Z    | repair    | focused gates    | 52 focused routing/expense/provider/runner/parity/SSOT tests passed; changed TypeScript roots type-check and format clean.                                                           |
| 2026-09-04T16:12Z    | repair    | agentic gates    | Structured agentic check selected 187 files / 2 batches with 0 diagnostics; full agentic suite passed 583 / failed 0.                                                                |
| 2026-09-04T16:20Z    | repair    | repository gates | Repository check selected 3,140 files / 27 batches / 0 diagnostics; full suite passed 5,278, failed 0, ignored 19 under executable `/tmp`.                                           |
| 2026-09-04T16:35Z    | IMPL-EVAL | cycle 3          | Fresh native Claude Opus 5 xhigh feature-tier session returned `FAIL_FIX`: four unstated DeepSeek efforts had been raised to high/max, plus one compatibility-transport wording gap. |
| 2026-09-04T16:41Z    | repair    | matrix fidelity  | Restored all four unstated DeepSeek efforts to `provider_default`, pinned them in the owner-matrix test, and documented that Claude/OpenRouter is outside active matrix selection.   |
| 2026-09-04T16:41Z    | repair    | focused gates    | Structured focused suite passed 59/59 after the repair; agentic TypeScript check selected 187 files / 2 batches / 0 diagnostics; changed TS format clean.                            |
| 2026-09-04T16:49Z    | IMPL-EVAL | cycle 4          | Same native Claude Opus 5 xhigh evaluator session independently returned `PASS` at real implementation head `74c6299b006c866`; every bounded finding closed.                         |

## Gate Results

| Gate                    | Status     | Evidence                                                                                                                   |
| ----------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| PLAN-EVAL cycle 1       | FAIL_PLAN  | `plan-eval.md`; three bounded design fixes, no production implementation started                                           |
| PLAN-EVAL cycle 2       | PASS       | `plan-eval.md`; same evaluator session, repair head `372409ab6`                                                            |
| implementation gates    | NOT_RUN    | hard stop until PLAN-EVAL PASS                                                                                             |
| IMPL-EVAL cycle 1       | FAIL_FIX   | `evaluate.md`; catalog spellings, spawn-denial proof, README wording, and S4/S5 comment trail                              |
| Repair check            | PASS       | 4 changed TS files, 1 batch, 0 diagnostics                                                                                 |
| Repair tests            | PASS       | 18 passed, 0 failed; includes expense denial before the injected process-spawn seam                                        |
| Repair format           | PASS       | structured formatter selected/processed 4 files, 0 findings                                                                |
| Agentic repair check    | PASS       | 185 files, 2 batches, 0 diagnostics                                                                                        |
| Agentic repair tests    | PASS       | 572 passed, 0 failed after cycle-1 repair                                                                                  |
| IMPL-EVAL cycle 2       | PASS       | same session; exact head `8740b16de`; 185-file check, 43 focused tests, 4-file format, all five findings closed            |
| Post-eval evidence      | SUPERSEDED | owner dashboard plus authenticated Go API contradicted flat-limit and privileged-tier assumptions; repair in progress      |
| Live Go expense smoke   | PASS       | watcher exited 4 with structured `provider_rate_limited`; effective Grok windows $3/$7.50/$15; no paid model spawned       |
| Focused repair tests    | PASS       | 52 passed, 0 failed; includes missing-authority/model-cell denial before fetch/spawn and live usage failures before spawn  |
| Agentic repair suite    | PASS       | 187 files checked / 0 diagnostics; 583 tests passed / 0 failed                                                             |
| Repository repair suite | PASS       | 3,140 files checked / 0 diagnostics; 5,278 tests passed / 0 failed / 19 ignored                                            |
| IMPL-EVAL cycle 3       | FAIL_FIX   | four DeepSeek cells silently raised an unstated effort; Claude/OpenRouter compatibility boundary needed explicit wording   |
| Cycle-3 repair tests    | PASS       | 59 passed / 0 failed; new assertions pin all four previously unstated DeepSeek efforts to `provider_default`               |
| Cycle-3 repair check    | PASS       | 187 files / 2 batches / 0 diagnostics                                                                                      |
| Cycle-3 repair format   | PASS       | 2 changed TypeScript files processed / 0 findings                                                                          |
| IMPL-EVAL cycle 4       | PASS       | 187-file check; 583/583 agentic; 23/23 matrix/parity; 49/49 expense/credential/runner/SSOT; changed-file format clean      |
| S1 check                | PASS       | structured check selected 2 files; 0 diagnostics                                                                           |
| S1 tests                | PASS       | 11 passed, 0 failed across matrix and volatile-value guard                                                                 |
| S2 check                | PASS       | 5 changed routing/contract files checked, 0 diagnostics                                                                    |
| S2 tests                | PASS       | 28 passed across matrix, resolver, state rendering, and contract                                                           |
| S3 check                | PASS       | 9 expense, credential, runner, profile, and CLI files checked; 0 diagnostics                                               |
| S3 tests                | PASS       | 33 passed, 0 failed across expense, credential, runner, profile, and SSOT guards                                           |
| S4 parity               | PASS       | generated workload/coordinator tables exactly match typed matrix; 6 tests pass                                             |
| S4 stale-policy scan    | PASS       | no retired active routing claims in skills/harness/tooling (runs/debt excluded)                                            |
| Agentic full check      | PASS       | 185 files, 2 batches, 0 diagnostics                                                                                        |
| Agentic full tests      | PASS       | 570 passed, 0 failed                                                                                                       |
| Repository check        | PASS       | 3,140 files, 27 batches, 0 diagnostics                                                                                     |
| Repository lint/fmt     | PASS       | 2,135 files, 37 batches each, 0 findings                                                                                   |
| Repository tests        | PASS*      | 5,263 pass; 2 unchanged-main tests red only on no-exec `/ephemeral`; exact file rerun under executable `/tmp`: 31 pass     |
| OpenCode Go smoke       | PASS       | structured allowance `allowed`; exact marker from guarded paid route                                                       |
| Provider discovery      | PASS       | OpenCode lists OpenRouter, OpenCode Go, and Ollama Cloud auth plus 27 Go/22 Ollama models; selected OpenRouter ids present |
