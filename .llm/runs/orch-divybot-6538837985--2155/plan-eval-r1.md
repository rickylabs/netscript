# PLAN-EVAL — issue 2155

**Verdict: FAIL_PLAN.** One plan item is missing and needs a small fix. All other checklist items pass. Evaluated on the bootstrap head `4d68d1f` against baseline `ad252e8`, read-only; I did not read `profiles/`.

## Source spot-checks (load-bearing claims)

| Claim | Result |
| --- | --- |
| #12: retry is set on the definition, not in the builder spec | **Confirmed.** `trigger-definition.ts:31` has `retry?`. `trigger-processor.ts:168` uses `definition.retry ?? defaultRetryPolicy()`. `WebhookSpec` and the frozen `defineWebhook` result (`define-webhook.ts:24-69`) leave it out. |
| #3: the worker claims before dispatch and marks applied after success | **Confirmed.** `job-dispatcher.ts:92` claims, `:186` calls `markApplied`, `:192/234` call `release`. There is a crash window, so delivery is at-least-once. |
| #11: the default processors are only API + combined | **Confirmed.** `workers-contribution.ts:46-66` starts `workers-api` and `workers-combined`. `bin/combined.ts` calls `startCombinedProcess()` from `runtime.ts`. |
| #6: the packaged and generated saga entrypoints are different | **Confirmed.** `sagas-contribution.ts:108` uses `saga-runner.ts`. `scaffold.plugin.json:30,47` uses `sagas/runtime.ts`. |
| #4/#10: a producer can stop without sending EOF | **Confirmed.** `durable-stream-producer-supervisor.ts:184` stops without EOF, and `:213` drains then sends EOF. `stop()` cancels queued writes with `producer-stopped`. The plan's mitigations ("check receipts", "stop a shared producer without EOF") cover this. |
| Generated-carrier conflict | **Confirmed.** `check:publish-assets` (`deno.json:129`) checks `packages/mcp/src/publish-assets.generated.ts`, which will go stale when the docs change. |

## Checklist

- **Research present and current:** PASS. All twelve items were re-checked against `ad252e8` and backed by source.
- **Decisions locked:** PASS, with one exception. The retry decision is locked, but the snippet shape it depends on is not (see below).
- **Open-decision sweep:** **UNCHECKED.** See the blocker below.
- **Commit slices:** PASS. Three ordered slices, fewer than 30 files, each with gates. S1 lists its files by docs topic, which is enough for a docs wave.
- **Risk register:** **UNCHECKED** for the retry workaround (same blocker). The other risks are listed with mitigations.
- **Gate set:** PASS. Package F-gates and jsr-audit are marked N/A with a docs-only reason. The SCOPE-docs overlay is covered by `docs/site verify`, `docs:snippets`, `docs:accuracy` and `drift.md`. Full CLI E2E is N/A for a reason the plan gives. Requiring an independent review before slice sign-off and an IMPL-EVAL on the exact pushed SHA rules out self-certification.
- **Deferred scope:** PASS.
- **jsr-audit:** N/A, justified.

## Blocker — retry workaround design (#12)

The plan says to "show a typed, frozen definition override" but doesn't fix the snippet's shape. Source shows two traps that the gates won't catch: `docs:snippets` only type-checks, and no local runtime E2E is allowed.

1. **Duplicate registration can silently drop the retry.** The runtime registry (`trigger-registry-compiler.ts:77-80`, which Aspire injects through `NETSCRIPT_TRIGGER_REGISTRY_MODULE`) imports every export from `triggers/*.ts` that has an `id`, `kind` and `handler`. It then keys a `Map` by id. If the example exports both the builder result and the override, the same id is registered twice. Whichever comes last in namespace order wins, so the definition that runs may be the one without retry, and nothing reports an error.
2. **Static discovery won't see the override.** The contribution walker only matches `export const X = defineWebhook(` and the other `defineX(` calls (`ast-extractor.ts:168,184`). An `Object.freeze({ ...base, retry })` export is therefore missing from `.netscript/generated/triggers.registry.ts` and from the `plugins list` counts, even though it still runs.
3. **A partial policy is not merged with the defaults.** `TriggerRetryPolicy` requires every field, and `definition.retry` replaces `defaultRetryPolicy()` entirely.

**Required fix:** add a decision and a matching risk entry to `plan.md`:
- Keep the builder result in a non-exported local.
- Export exactly one definition per trigger id.
- Spell out the full `TriggerRetryPolicy` in the snippet.
- In the docs, say that static contribution discovery doesn't list the override, while the runtime registry still loads it.
- Cite the source lines above in `research.md`.

## Non-blocking confirmations

- The generated-carrier conflict is acknowledged in research, plan and drift. No change under `packages/**` is authorized and the gates are not weakened. Deferring it to the measured gate outcome and the coordinator is safe, because it won't force any docs rework. Reporting the result as unproven is allowed.
- The worker-recipe design (a standalone handler plus a streams producer, with receipts and flush/stop caveats) matches the source.
- The owner's override of the evaluator model is recorded verbatim in `worklog.md`.

VERDICT: FAIL_PLAN
