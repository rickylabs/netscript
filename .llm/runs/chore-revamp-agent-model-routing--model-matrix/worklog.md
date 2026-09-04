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

## Gate Results

| Gate                 | Status    | Evidence                                                                         |
| -------------------- | --------- | -------------------------------------------------------------------------------- |
| PLAN-EVAL cycle 1    | FAIL_PLAN | `plan-eval.md`; three bounded design fixes, no production implementation started |
| PLAN-EVAL cycle 2    | PASS      | `plan-eval.md`; same evaluator session, repair head `372409ab6`                  |
| implementation gates | NOT_RUN   | hard stop until PLAN-EVAL PASS                                                   |
| IMPL-EVAL            | NOT_RUN   | required after implementation                                                    |
| S1 check             | PASS      | structured check selected 2 files; 0 diagnostics                                 |
| S1 tests             | PASS      | 11 passed, 0 failed across matrix and volatile-value guard                       |
