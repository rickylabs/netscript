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
owner matrix cell ── checks every generator/evaluator family cross-product
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

| Time                 | Slice     | Step           | Notes                                                                                                                    |
| -------------------- | --------- | -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 2026-09-04T13:58:23Z | bootstrap | activated      | Read owner matrix first; selected Archetype 6 plus docs overlay; created isolated run.                                   |
| 2026-09-04T13:59:30Z | bootstrap | draft PR       | Pushed `f16ae59a5`; opened draft PR #1989.                                                                               |
| 2026-09-04T14:00Z    | research  | provider facts | Re-derived Astra, OpenCode Go, Ollama, provider catalog, current code surfaces, and limits from official/live sources.   |
| 2026-09-04T14:20Z    | design    | locked         | Chose typed matrix, logical/provider model split, exhaustive cross-family validation, and pre-spend fail-closed watcher. |

## Gate Results

| Gate                 | Status  | Evidence                                                                      |
| -------------------- | ------- | ----------------------------------------------------------------------------- |
| PLAN-EVAL            | PENDING | separate Muse Spark 1.3 max session to be launched at the committed plan head |
| implementation gates | NOT_RUN | hard stop until PLAN-EVAL PASS                                                |
| IMPL-EVAL            | NOT_RUN | required after implementation                                                 |
