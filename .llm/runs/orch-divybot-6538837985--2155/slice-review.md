# S1 slice review / first IMPL-EVAL — issue 2155

**Docs verdict: PASS.** The authorized docs change has no blocker and can be signed off for S1. The generated carriers are not green, and the merge prerequisites below are still open.

Same evaluator session as PLAN-EVAL, read-only. I reviewed the uncommitted S1 diff (`s1.diff`) against baseline `ad252e8`, on bootstrap head `4d68d1f`. I did not read `profiles/` or execute code. The gate exit codes are as reported in `gate-results.md`; I did not re-run them.

## All twelve findings vs shipped source

| # | Verified against | Result |
| --- | --- | --- |
| 1 | `saga-bus-bridge.ts` send dispatcher; reference `CascadedMessageTarget` and the handler-boundary prose | Accurate. `send`/`schedule` route saga messages, and the explicit `integration/workers` route is kept. |
| 2 | Already fixed on main; no rewrite | Correct to leave it alone. |
| 3 | `job-dispatcher.ts:92,186,192` (claim, then markApplied, then release) | The at-least-once crash window, the downstream operation key, and the corrected `idempotencyKey` row are all accurate. The at-most-once promise is gone. |
| 4 | `producer-contract-v1.ts:32-53,92-96`; `create-durable-stream.ts:183-196` | The default numbers match exactly: 8 attempts, 5000 ms timeout, 100 ms start, ×2, 5000 ms cap, 0.2 jitter, 256 events / 1,048,576 bytes. The four receipt outcomes, `flush`, `stop` without EOF and `close` with EOF all match. The `retention`/`reconnectPolicy`/`bufferPolicy`/`signal` option rows match. |
| 5 | Deploy table | Bare runtime 1 vs Aspire 2 is accurate, and the plural name is kept. |
| 6 | `sagas-contribution.ts:108` vs `scaffold.plugin.json:30,47` (all three plugins) | Packaged and generated entrypoints are kept apart in plugin-system and the glossary. |
| 7 | `trigger-runtime-processor.ts:331` | The stale claim that `defer` is unsupported is corrected. |
| 8 | The hidden URL is kept and now holds a self-contained worker lesson | The lesson is linked from the chat index, and route vs worker ownership is stated. |
| 9 | Compensation is persisted before cascades | The tutorial wording matches source. |
| 10 | See the recipe section below | Accurate. |
| 11 | `workers-contribution.ts:66` returns `[api, combined]`; `runtime.ts:140-168` runs scheduler plus worker; `public/mod.ts:63-66` `withService` has no port | Both snippets now match source. The single-scheduler-owner warning is supported: `scheduler-dispatch.ts` has no tick deduplication. |
| 12 | See the trigger retry section below | Accurate. |

## Worker recipe (#8/#10): it would work as written

- **Handler export:** `defineJobHandler(schema, handler)` returns a callable that is deliberately left open for `Object.assign(handler, { id })` (`job-handler.ts:93-101`). The repo's own official sample uses the same pattern (`official-sample-configuration.ts:416`). `ns-workers add job` scaffolds `workers/jobs/<id>.ts` (`job.ts:27`).
- **Streams wiring:** workers declares `"dependencies": ["streams"]` (`scaffold.plugin.json:57`). The reconciler turns that into a background `PluginReferences` entry (`plugin-reference-reconciler.ts:55-74`), so the worker process receives `services__streams__http__0`. The combined process already uses streams (`runtime.ts:144`).
- **Producer reuse:** calling the producer factory inside the handler is safe. `createDurableStream` reuses the producer when the configuration fingerprint matches, throws when it doesn't, and replaces a closed one (`create-durable-stream.ts:292-310`). A failed producer is recovered on the next job.
- **Lifecycle and idempotency:** the handler awaits `receipt.completion` and only treats `delivered` as success. It doesn't stop or close per job, and it doesn't tie the producer's lifetime to the job signal. Saying `messageId` is "correlation, not dedup" is correct: it is only a header (`create-durable-stream.ts:233-244`). Replays are keyed by a stable entity id.
- **CLI commands:** `show-job`, `trigger --payload=` and `executions --limit --json` exist (`commands.ts:161-211`).

## Trigger retry policy (#12): matches the round-2 locked design

- The builder result `base` is private, and the module has exactly one export, the default.
- All five fields of the retry policy are written out, with `satisfies TriggerRetryPolicy`.
- The page states that the runtime registry loads the definition but static discovery doesn't list it.
- It adds the `export *` barrel caveat.
- A note follows each of the three spec tables, and the `'memory'` verifier is labelled dev-only.
- The focused compile test covers both new fences, with a working negative control against the baseline.

## Gate sufficiency (docs)

These cover the docs change: the full `docs/site verify` run, Tier-1 snippets plus the new focused compile test, `docs:accuracy` (111/111 CLI commands), and 33 existing runtime tests that check the source behavior the docs describe.

Not running a scaffold E2E is consistent with the owner's prohibition. The runtime claims in the recipe are proven by source tracing, not by execution, and the final report must say so.

## Merge prerequisites still open (not part of the docs verdict)

1. **The agent-docs prose carrier is stale.** `gate-results.md` row 15 reports `agent-docs-prose.generated.ts` under `packages/cli` as stale (`fresh: false`). It is out of scope for this assignment, so it needs coordinator integration. It must not be reported as green.
2. **`check:publish-assets` was not measured.** `.llm/tools/generate-publish-assets.ts:16-30` embeds rendered `explanation/plugin-system` and `orchestration-runtime/how-to/author-a-plugin`, and both pages changed in this diff. So `packages/mcp/src/publish-assets.generated.ts` will very likely be stale too. Run `deno task check:publish-assets` (read-only `--check`), record the result in `gate-results.md` and `drift.md`, and add it to the coordinator handoff. Don't edit the carrier.
3. **Self-certification is not allowed.** CI state on the pushed head and a final independent IMPL-EVAL naming the exact pushed SHA are still required.

**Docs content:** PASS for S1 sign-off.
**Generated-carrier integration:** UNRESOLVED and outside the authorized scope. The merge is blocked on coordinator action for items 1 and 2.

VERDICT: PASS
