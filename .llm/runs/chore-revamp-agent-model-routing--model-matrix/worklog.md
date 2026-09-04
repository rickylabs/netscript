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

| Time                 | Slice     | Step           | Notes                                                                                                                                                                    |
| -------------------- | --------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-09-04T13:58:23Z | bootstrap | activated      | Read owner matrix first; selected Archetype 6 plus docs overlay; created isolated run.                                                                                   |
| 2026-09-04T13:59:30Z | bootstrap | draft PR       | Pushed `f16ae59a5`; opened draft PR #1989.                                                                                                                               |
| 2026-09-04T14:00Z    | research  | provider facts | Re-derived Astra, OpenCode Go, Ollama, provider catalog, current code surfaces, and limits from official/live sources.                                                   |
| 2026-09-04T14:20Z    | design    | locked         | Chose typed matrix, logical/provider model split, exhaustive cross-family validation, and pre-spend fail-closed watcher.                                                 |
| 2026-09-04T16:22Z    | PLAN-EVAL | cycle 1        | Muse Spark was rejected before a turn by the current OpenRouter privacy setting; declared Grok 4.6 xhigh fallback returned `FAIL_PLAN`.                                  |
| 2026-09-04T16:24Z    | design    | bounded repair | Locked vendor-level family composition, exact per-tier evaluation limits, and fail-closed legacy-lane behavior.                                                          |
| 2026-09-04T16:29Z    | PLAN-EVAL | cycle 2        | Same OpenCode session `ses_f9338f842ffeT0E2CjAp7yu3KZ`, Grok 4.6 xhigh, returned `PASS` at repair head `372409ab6`.                                                      |
| 2026-09-04T16:38Z    | S1        | implemented    | Added volatile model slugs, vendor-family catalog, five workload tiers, four coordinator tiers, exact eval policies, fallback composition, and fail-closed legacy lanes. |
| 2026-09-04T16:49Z    | S2        | implemented    | Replaced the flat resolver with matrix-derived workload/coordinator resolution, provider precedence, selected-family skipping, and explicit legacy rejection.            |
| 2026-09-04T14:47Z    | S3        | implemented    | Added OpenCode Go/Ollama/OpenRouter credential isolation, paid-route provider profiles, fail-closed structured subscription expense decisions, and CLI preflight.        |
| 2026-09-04T14:57Z    | S4        | implemented    | Replaced stale named-lane prose with workload/coordinator matrix policy across active harness, evaluator, manager, remote, OpenHands, docs-audit, and tooling surfaces.  |
| 2026-09-04T15:10Z    | S5        | live/gates     | Proved all three auth registrations, live Go/Ollama/OpenRouter catalogs, corrected three nonexistent Ollama capabilities, and completed one guarded OpenCode Go turn.    |
| 2026-09-04T15:25Z    | IMPL-EVAL | cycle 1        | Separate OpenCode Go / Grok 4.6 xhigh session `ses_f93062116ffe1eRZWsVs5ukzqK` returned `FAIL_FIX` at `9f8ee61a6` with five bounded findings.                         |
| 2026-09-04T15:32Z    | repair    | implemented    | Corrected native Claude and dated Ollama dispatch ids, added the pre-spawn expense-denial seam/test, and replaced the stale README resolver claim.                         |
| 2026-09-04T15:32Z    | reconcile | live review    | Reconciled owner live-substrate comments: Astra remains active as instructed; paid training remains eligible; external CLI/desktop toolchain is current.                  |

## Gate Results

| Gate                 | Status    | Evidence                                                                                                                   |
| -------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------- |
| PLAN-EVAL cycle 1    | FAIL_PLAN | `plan-eval.md`; three bounded design fixes, no production implementation started                                           |
| PLAN-EVAL cycle 2    | PASS      | `plan-eval.md`; same evaluator session, repair head `372409ab6`                                                            |
| implementation gates | NOT_RUN   | hard stop until PLAN-EVAL PASS                                                                                             |
| IMPL-EVAL cycle 1    | FAIL_FIX  | `evaluate.md`; catalog spellings, spawn-denial proof, README wording, and S4/S5 comment trail                               |
| Repair check         | PASS      | 4 changed TS files, 1 batch, 0 diagnostics                                                                                 |
| Repair tests         | PASS      | 18 passed, 0 failed; includes expense denial before the injected process-spawn seam                                        |
| Repair format        | PASS      | structured formatter selected/processed 4 files, 0 findings                                                               |
| Agentic repair check | PASS      | 185 files, 2 batches, 0 diagnostics                                                                                        |
| Agentic repair tests | PASS      | 572 passed, 0 failed after cycle-1 repair                                                                                  |
| S1 check             | PASS      | structured check selected 2 files; 0 diagnostics                                                                           |
| S1 tests             | PASS      | 11 passed, 0 failed across matrix and volatile-value guard                                                                 |
| S2 check             | PASS      | 5 changed routing/contract files checked, 0 diagnostics                                                                    |
| S2 tests             | PASS      | 28 passed across matrix, resolver, state rendering, and contract                                                           |
| S3 check             | PASS      | 9 expense, credential, runner, profile, and CLI files checked; 0 diagnostics                                               |
| S3 tests             | PASS      | 33 passed, 0 failed across expense, credential, runner, profile, and SSOT guards                                           |
| S4 parity            | PASS      | generated workload/coordinator tables exactly match typed matrix; 6 tests pass                                             |
| S4 stale-policy scan | PASS      | no retired active routing claims in skills/harness/tooling (runs/debt excluded)                                            |
| Agentic full check   | PASS      | 185 files, 2 batches, 0 diagnostics                                                                                        |
| Agentic full tests   | PASS      | 570 passed, 0 failed                                                                                                       |
| Repository check     | PASS      | 3,140 files, 27 batches, 0 diagnostics                                                                                     |
| Repository lint/fmt  | PASS      | 2,135 files, 37 batches each, 0 findings                                                                                   |
| Repository tests     | PASS*     | 5,263 pass; 2 unchanged-main tests red only on no-exec `/ephemeral`; exact file rerun under executable `/tmp`: 31 pass     |
| OpenCode Go smoke    | PASS      | structured allowance `allowed`; exact marker from guarded paid route                                                       |
| Provider discovery   | PASS      | OpenCode lists OpenRouter, OpenCode Go, and Ollama Cloud auth plus 27 Go/22 Ollama models; selected OpenRouter ids present |
