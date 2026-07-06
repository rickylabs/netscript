# IMPL-EVAL — TEL-T4 W3C hardening + triggers parenting bugfix (issue #405, PR #559)

## Verdict

**[PHASE: IMPL-EVAL] [VERDICT: PASS]**

## Summary

All six load-bearing claims independently verified. The correctness bug is fixed (traceIds now share the inbound remote trace), the W3C hardening is sound, namespacing is correct, core stays telemetry-dep-free, gates pass, and the plan divergence (ingress span in processor, not core) is both justified and well-implemented.

## Findings (0)

None.

## Independent verification

### 1. Regression test genuineness

**VERIFIED.** Reverted `plugins/triggers/src/runtime/trigger-runtime-processor.ts` to `a1669f60` and ran the test.

```
Test: trigger ingress, detect, and process spans share the inbound trace (regression #405)
Result: FAILED -- "expected a trigger.ingress span"
```

The pre-fix processor never created an ingress SERVER span and did not thread parent context, so the test correctly caught the bug. Restoring the fix made it pass. The `ParentAwareRecorder` correctly derives `traceId` from `getSpanFromContext(parentContext)` -- without threading, each span gets a fresh random traceId. Test is genuine and load-bearing.

### 2. W3C hardening

**VERIFIED.** `parseTraceparent` now validates:
- `HEX_VERSION` (exact 2-char lowercase hex) + rejects reserved `ff`
- `HEX_TRACE_ID` (exact 32-char) + rejects all-zero
- `HEX_SPAN_ID` (exact 16-char) + rejects all-zero
- `HEX_FLAGS` (exact 2-char)

`parseTraceState` implements immutable `ParsedTraceState` with W3C move-to-front on `set()`, 32-member cap, malformed member dropping, undefined for empty. `extractContext` now attaches `tracestate` to the remote span context. All 5 telemetry tests pass (w3c_test.ts).

### 3. `netscript.*` namespacing

**VERIFIED.** `TriggerAttributes` uses `netscript.trigger.*` prefix for all custom keys. Standard semconv keys (`http.status_code`) retained. `DeprecatedTriggerAttributes` maps canonical to deprecated keys with alias window. `withDeprecatedAliases()` mirrors old keys alongside new during the deprecation window. `setSpanAttribute()` handles post-hoc attribute setting (outcome/error_class).

### 4. `-core` stays telemetry-dep-free

**VERIFIED.** `grep -rn "@netscript/telemetry" packages/plugin-triggers-core/src/` returned zero results. The core only changed its own constants in `attributes.ts`. No telemetry package dependency. Matches `plugin-workers-core` reference pattern.

### 5. No new casts; gates pass; no `deno.lock` churn

**VERIFIED.**
- Casts: `as never` in test (queue cast), `as TriggerEventId`/`as TriggerId` (test fixtures), `as Record<string, unknown>` (existing). No new casts in production code.
- Gates: telemetry 27/27, triggers-core 38/0 (exceeds brief 5/5), triggers plugin 20/0 (exceeds brief 4/4). Scoped check/lint/fmt all 0 findings.
- `deno.lock`: zero diff against base `a1669f60`.

### 6. Plan divergence: ingress span in processor (justify)

**SOUND.** The rationale is compelling:
- `create-trigger-ingress.ts` returns 202 immediately; processing happens in a detached microtask
- The request's async context is gone by the time `process()` runs
- The durable link is the captured `traceparent`/`tracestate` on the `TriggerEvent`
- Re-establishing via `extractFromTraceContext({ traceparent, tracestate })` is correct
- The `#runSpan` method explicitly threads context through `contextWithSpan` -- does not rely on the global context manager
- Core stays telemetry-dep-free; only the plugin processor does the re-parenting

## Gate evidence

```
Scoped check (telemetry + plugin-triggers-core + plugins/triggers): 0 findings
Scoped lint: 0 findings
Scoped fmt: 0 findings
deno test packages/telemetry: 27 passed, 0 failed
deno test packages/plugin-triggers-core: 38 passed, 0 failed
deno test plugins/triggers: 20 passed, 0 failed (9 steps, 12 ignored e2e)
deno.lock diff a1669f60..HEAD: 0 lines
```

## Merge close-gate

PR #559 body contains `Closes #405`. Issue #405 is OPEN. The implementation addresses all acceptance criteria from #405:
- Regression test shares `traceId`
- Tracestate round-trips
- Triggers uses shared facade
- TC-1 through TC-9 pass
- Plugin-triggers-core telemetry 5/5
- `netscript.*` namespacing
- Deprecated-alias window

## Recommendation

Merge on green. The correctness bug is fixed, the W3C hardening is sound, gates pass, and the plan divergence is justified. Post-merge: watch for any e2e regressions in the Flow-B trace continuation (though T8 #409 will validate that explicitly).

OPENHANDS_VERDICT: PASS
