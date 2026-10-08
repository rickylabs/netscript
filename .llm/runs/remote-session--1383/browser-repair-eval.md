# Browser-repair-eval — remote-session--1383 (post-PASS gate repair)

- Evaluator session: Muse Spark, same independent session as PLAN-EVAL/IMPL-EVAL (`ses_f82065586ffeLljGd8IO7l8SLt`), 2026-09-08. Generator: Astra medium. Route: `matrix-browser-repair-review.json`, `implementation_evaluation` tier `complex`, `muse_spark_1_3@max` — independent family/session preserved.
- Delta reviewed: `75d0e0475..9ef919aa1` — `2af28ec17` (Aspire surface manifest +2 rows, gate fixture only) and `9ef919aa1` (reference-probe browser-selector reuse + empty-override regression test). Prior `impl-eval.md` PASS preserved verbatim below; this file is additive.
- Compliance: read-only review. No product edits, commits, releases, AppHost starts, or resource mutation. Re-ran focused wrappers with an owned `TMPDIR`; removed it afterwards. No global system edits. Full runtime/CI remains coordinator-owned, not claimed.

## What changed

`probe-app-reference.ts` `findBrowserExecutable()` previously ran a private fixed-system-path candidate scan (`Deno.stat` existence check, no executability/version probe) that ignored `NETSCRIPT_E2E_BROWSER_EXECUTABLE`. It now delegates to the existing `selectBrowserExecutable()` from `service-client-browser-probe.ts` and returns `.path` [observed - `packages/cli/e2e/src/application/gates/scaffold/runtime/probe-app-reference.ts:3,141-143`]. Net deletion of ~23 lines, one import added. New regression test asserts an explicitly empty override rejects with "value is empty" and restores prior env state in `finally` [observed - `packages/cli/e2e/tests/application/gates/probe-app-reference_test.ts:82-92`]. Auth product diff after PASS is empty — no auth behavior touched.

## Verification (independent, source-backed)

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Focused tests (reference + resolver suites) | PASS, re-run with owned TMPDIR | 35 passed / 0 failed (`probe-app-reference_test.ts` + `service-client-runtime-probe_test.ts`) |
| Type check (probe + new test) | PASS, re-run | `deno check` clean, both files |
| Import cycle | PASS | `service-client-browser-probe.ts` imports only `service-client-browser-diagnostics.ts` (self-contained, 167 lines, no reference imports); `probe-app-reference.ts` → `service-client-browser-probe.ts` is one-directional; `deno check` confirms |
| Native selector semantics reused, not reinvented | PASS | `selectBrowserExecutable` honors strict explicit override (empty → throw, no fallback), probes `--version` bounded, checks executable bit, aggregates candidate failures [observed - `service-client-browser-probe.ts:461-510`] |
| Failure-closed override | PASS | empty-override test asserts rejection naming "value is empty"; strict-override path never falls through to the allowlist |
| Beachhead receipts honesty | PASS | both retained: initial `/ephemeral/tmp` noexec failure (29/2, permission-denied spawn, environment property — not a code defect) and repaired 35 PASS under owned TMPDIR |
| No global/system edits | PASS | test-local `Deno.makeTempDir` fixtures; env var save/restore in `finally`; no browser install, no PATH/LD_LIBRARY_PATH mutation in the diff |
| Downstream consumers intact | PASS | `probe-island-hydration.ts` and `probe-island-served-surface.ts` consume the same `findBrowserExecutable` export unchanged; stricter resolver only makes their lookup honor the override they previously bypassed |
| Pre-existing source self-policing | PASS | resolver suite already asserts `findBrowserExecutable` absent from the service-client probe source (`service-client-runtime-probe_test.ts:925`); the reuse direction complies — reference reuses resolver, not vice versa |

## Findings

**B1 (positive) — duplicate locator removed, single policy.** Two browser locators disagreed (existence-only scan vs executable/version-validated selector with override support). The repair deletes the weaker one and reuses the stronger; this is framework gate reuse, not a new browser policy. No new dependency, discovery rule, or auth behavior.

**B2 (note) — behavioral tightening is failure-closed and intended.** Paths that previously resolved via fixed locations (`/usr/bin/chromium`, etc.) now go through the validated selector: nonexistent/non-executable candidates are skipped, and a set-but-empty override throws instead of falling back. The drift log records this; the direction (explicit misconfiguration fails loudly) is correct for a gate.

**B3 (note) — `/ephemeral/tmp` noexec is environmental.** The initial 2 failures are `Permission denied` on fixture spawn under `/ephemeral/tmp`, unrelated to the repair. Owned-TMPDIR re-run is the valid verdict source; both receipts retained per brief.

## Verdict

`PASS` (bounded post-PASS repair)

The browser-selector repair is correct, minimal, cycle-free, and proven by 35 focused tests plus clean type check. Prior `impl-eval.md` `PASS` stands unmodified. Full `scaffold.runtime` completion and exact-head CI remain coordinator-owned and are not claimed here.
