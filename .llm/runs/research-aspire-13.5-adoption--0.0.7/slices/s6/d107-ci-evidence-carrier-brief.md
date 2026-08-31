# S6 D-107 bounded correction: CI does not persist the listener-unreachable receipt

## Problem

Workflow run 33340547883 (exact head `c1f425eb962ed77ae25e108def18a5d22da2f5ac`) passed both tiers
(`scaffold.runtime` and `scaffold.runtime.sqlite`, including `runtime.health.listener-unreachable`
green on both), but no per-tier `.netscript/e2e/listener-unreachable-receipt.json` was uploaded or
printed. The receipt is written by `listener-unreachable-fixture.ts` at
`${projectRoot}/.netscript/e2e/listener-unreachable-receipt.json` (inside the scaffolded scratch
project, under the job's `.llm/tmp/...` tree). The `Upload E2E report artifact` step in
`.github/workflows/e2e-cli.yml` (both the `scaffold-runtime` and `scaffold-runtime-sqlite` jobs) only
globs:

```
.llm/tmp/**/report*.json
.llm/tmp/**/report*.ndjson
**/e2e-report*.json
```

The receipt file is named `listener-unreachable-receipt.json`, which matches none of those patterns,
so it is silently dropped (`if-no-files-found: ignore`).

## Scope of this correction (bounded — CI/harness only, no product semantic change)

1. In `.github/workflows/e2e-cli.yml`, add `**/listener-unreachable-receipt.json` to the `path:` list
   of the `Upload E2E report artifact` step in **both** the `scaffold-runtime` and
   `scaffold-runtime-sqlite` jobs, so each tier's receipt is captured alongside the existing report
   JSON/NDJSON.
2. Do not change `listener-unreachable-fixture.ts`'s write location, the receipt's shape, the gate
   logic, or any health-check/exit-code semantics — this is purely a CI artifact-glob fix.
3. No PLAN-EVAL. No DeepSeek/OpenRouter rerun.

## After this change

Commit and push. The coordinator will trigger exactly one fresh exact-head `workflow_dispatch` run
(same commit, unless this fix requires its own commit — in which case the new head) to confirm both
tiers' receipts are now present in the uploaded artifact. No re-evaluation of the S6 slice's already
-accepted IMPL-EVAL/Tier-A verdicts is needed for this change.
