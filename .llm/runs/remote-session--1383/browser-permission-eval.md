# Browser-permission-eval — remote-session--1383 (production gate permission repair)

- Evaluator session: Muse Spark, same independent session as PLAN-EVAL/IMPL-EVAL/browser-repair-eval (`ses_f82065586ffeLljGd8IO7l8SLt`), 2026-09-08. Generator: Astra medium. Route: `matrix-browser-permission-review.json`, `implementation_evaluation` tier `complex`, `muse_spark_1_3@max` — independent family/session preserved. Third implementation-review pass, disclosed per loop notification policy.
- Delta reviewed: `9ef919aa1..82f14a809` — `behavior-gates.ts` gains `--allow-env=${BROWSER_EXECUTABLE_ENV}` on exactly the two gate argvs that execute the env-reading probes (`BEHAVIOR_APP_REFERENCE`, `BEHAVIOR_ISLAND_HYDRATION`); canonical argv assertions updated in `runtime-gates_test.ts`. Prior verdicts (`impl-eval.md`, `browser-repair-eval.md`) preserved; this file is additive.
- Compliance: read-only review. No product edits, commits, releases, AppHost starts, or resource mutation. Re-ran focused tests with an owned TMPDIR (removed afterwards); permission-contract probes used an owned executable fixture dir (removed afterwards). Full runtime/CI remains coordinator-owned, not claimed.

## The omission, assessed honestly

The prior narrow `PASS` covered the resolver/test layer (35 tests, type check, cycle check) but not the production gate argv layer. The failure mode was real: the repaired `findBrowserExecutable()` reads `NETSCRIPT_E2E_BROWSER_EXECUTABLE` at call time via `selectBrowserExecutable()`'s default parameter, but the two gates spawn their probes as `deno run` subprocesses without env permission — so the subprocess `Deno.env.get` throws `NotCapable` and the gate fails after ~90 prior gates passed. The drift log records this as a genuine integration omission in `9ef919aa1`, not an environmental excuse. Correct framing; the bounded scope of the previous PASS is acknowledged, not rewritten.

## Verification (independent, source-backed)

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Focused tests (builders + reference + resolver) | PASS, re-run with owned TMPDIR | 67 passed / 0 failed (matches `browser-permission-tests.json`) |
| Type check (gate defs + assertions) | PASS, re-run | `deno check` clean, both files |
| Import cycle | PASS | `behavior-gates.ts` → `service-client-browser-probe.ts` one-directional (const import only); resolver imports nothing gate-side; `deno check` confirms |
| Least privilege (no broad grant) | PASS | each argv gains exactly one `--allow-env=${BROWSER_EXECUTABLE_ENV}` naming the single variable; no `--allow-env` bare grant anywhere in the file; the only other `--allow-env=` is the pre-existing scoped `WORKERS_API_URL,SAGAS_API_URL` |
| Exact permission contract (live, unmocked) | PASS | restricted subprocess with ONLY `--allow-env=NETSCRIPT_E2E_BROWSER_EXECUTABLE`: `Deno.env.get` succeeds (selector proceeds to version probe); without the flag: `NotCapable: Requires env access` — the exact production failure, now closed |
| Failure-closed override preserved | PASS (live) | empty override under the granted flag still rejects `value is empty` — the permission grant does not weaken strictness |
| Version-gate intact | PASS (live) | fixture emitting non-browser `--version` output rejected with `unrecognized browser version output` — override is validated, not trusted blindly |
| Coordinator restricted-launch receipt | consistent, prerequisite-only | `browser-restricted-launch.json`: exit 0 + marker; scope labelled browser-prerequisite, no app acceptance claimed |
| Auth product untouched | PASS | auth diff empty since prior PASS; no auth behavior in this delta |

## Findings

**P1 (positive) — minimal least-privilege fix.** Two one-line additions, both referencing the selector's own exported constant (no string-duplicated var name to drift). Canonical argv assertions pin the flags. Consistent with the file's existing scoped `--allow-env=` pattern.

**P2 (note) — sibling gate without the flag is correct.** `BEHAVIOR_ISLAND_SERVED_SURFACE` spawns `probe-island-served-surface.ts`, which resolves URLs without a browser launch (no `findBrowserExecutable` import) — it needs no grant. The fix covers exactly the two gates whose probes launch a browser.

**P3 (limitation) — full `scaffold.runtime` green at head is still coordinator-owned.** The permission repair unblocks the previously failing gate, but end-to-end completion at `82f14a809` is not independently observed here and is not claimed.

## Verdict

`PASS` (bounded production-gate permission repair)

The two-flag grant closes the exact `NotCapable` failure through the least-privilege path, preserves failure-closed override semantics, and is pinned by 67 focused tests plus clean type check. Prior verdicts stand. Full runtime completion and exact-head CI remain coordinator-owned downstream work.
