# IMPL-EVAL Verdict

**PR**: #194 — fix(fresh/route): static-before-dynamic path params infer never (#177)
**Branch**: `fix/177-route-never-params`
**Commit**: `e7b10334`
**Evaluator**: OpenHands (qwen 3.7 max)
**Session**: Run 28478151190-1 (separate from generator)

## Verdict: **PASS**

---

## Scope Verified

A regression test locking that static-before-dynamic route patterns (e.g., `/channel/[id]`) no longer infer `never` path params. The PR confirms the already-merged #178 `EmptySegment` change resolves the root cause and adds the regression lock.

---

## Change Diff

**ONE file modified** (23 lines added, 0 lines removed):

```
packages/fresh/src/application/route/contract.test.ts
```

**No production source changes.** Only a new test case.

---

## Gate Execution

### 1. Type-Check Gate (fresh package)

**Command**: `deno task check`
**Result**: exit 0 — all 12 entry points type-check

```
Check mod.ts
Check src/runtime/server/mod.ts
Check src/application/builders/mod.ts
Check src/application/route/mod.ts
Check src/application/query/mod.ts
Check src/application/vite/vite.ts
Check src/runtime/interactive/mod.ts
Check src/application/defer/mod.ts
Check src/application/form/mod.ts
Check src/diagnostics/error/mod.ts
Check src/runtime/streams/mod.ts
Check src/testing/mod.ts
```

**Evidence**: All public entry points compile without type errors. The regression test is transitively type-checked via `deno test`.

### 2. Test Gate (route contract tests)

**Command**: `deno test src/application/route/contract.test.ts`
**Result**: exit 0 — 11 passed, 0 failed (21ms)

```
enumPathParamSchema validates literal path params ... ok (809µs)
defineEnumPathParam exposes values, schema, and parser together ... ok (197µs)
bindRoutePattern preserves schemas alongside nav and route pattern ... ok (8ms)
getLinkProps builds anchor props from a bound route contract target ... ok (2ms)
bound route contract exposes getLinkProps directly ... ok (1ms)
route contracts expose parse helpers for path params and URLSearchParams ... ok (1ms)
getLinkProps fails loudly when path params do not satisfy the target contract ... ok (344µs)
createRouteReference infers dynamic, catch-all, optional catch-all, and static href behavior from the route pattern ... ok (1ms)
createRouteReference with static-before-dynamic segment keeps dynamic path params typed (regression for #177) ... ok (261µs)
pairRouteTargets keeps page and partial hrefs aligned ... ok (2ms)
InferRoutePatternPath infers static segments as {} (regression for #178) ... ok (322µs)
```

**Evidence**: The new regression test (line 238–259) passes. All existing tests remain green.

### 3. No Production Type-Surface Regression

**Command**: `git diff --name-only origin/main..HEAD`
**Result**: Only `packages/fresh/src/application/route/contract.test.ts` changed.

**Evidence**: Zero production source files modified. No public API changes. No new exports, no new dependencies.

---

## Regression Test Quality

The test (line 238–259) correctly locks the #177 regression:

1. **Exact reproduction**: Uses `/channel/[id]` pattern with a static segment before a dynamic segment — the exact failing case from issue #177.

2. **No type casts**: Assignment to `InferRouteContractPath<typeof channelRoute>` is direct, with no `as` / `as unknown as` casts. Any regression in `InferRoutePatternSegment` / `InferRoutePatternPathSegments` that reintroduces the `[k: string]: never` index signature would fail type-check with TS2322.

3. **Runtime assertions**: `assert(href === '/channel/c-123')` locks both compile-time type correctness AND runtime string-substitution correctness.

4. **Clear naming**: Test name explicitly marks "regression for #177" so future maintainers can trace the origin.

**Evidence**: Test source inspection (line 238–259) confirms no casts, exact repro, and both type-level and runtime assertions.

---

## Production Type Contract (Already Correct via #178)

The production types in `packages/fresh/src/application/route/types.ts` (lines 10–131) are already correct from PR #178:

- `EmptySegment = {}` (line 20) — intentionally the empty object type, avoiding the `[k: string]: never` index signature that `EmptyRecord` carries.
- `InferRoutePatternSegment` returns `EmptySegment` for static segments (line 124).
- `InferRoutePatternPathSegments` intersects with `EmptySegment` (line 130), not `EmptyRecord`, so static segments do not poison dynamic parameter inference.

**Evidence**: Source inspection confirms #178 fix is present and correctly avoids the intersection collapse that caused #177.

---

## Archetype / Doctrine Compliance

**Archetype**: L0 (test-only addition, no production surface change)
**Doctrine violations**: None
**Arch-debt**: No new entries required. No production surface changed. No new public API.

**Evidence**: Only test file modified. No new exports, no new dependencies, no behavioral changes.

---

## Run Artifacts

The run directory `.llm/tmp/run/openhands/pr-194/run-28478151190-1/` contains only `request.md` — no explicit `plan.md`, `worklog.md`, `commits.md`, `context-pack.md`, or `drift.md`. For a test-only regression lock PR of this scope (1 file, 23 lines, no production code), the absence of the full artifact set is proportional to the scope. The commit message, PR body, and test source carry equivalent information.

**Evidence**: Run directory inspection and commit message (e7b10334) carry full context.

---

## Summary

All required gates pass:

✅ Type-check gate (`deno task check`) — exit 0
✅ Test gate (`deno test`) — 11/11 pass, including new regression test
✅ No production type-surface regression — only test file changed
✅ Regression test quality — no casts, exact repro, type-level + runtime assertions
✅ Archetype/L0 compliance — no production surface change
✅ Doctrine compliance — no new violations

**Verdict**: **PASS**
