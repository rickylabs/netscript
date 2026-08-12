# Pre-merge gate — PR #1584 (closes #1227)

Head **`4f93d3134`**, 2026-08-12. Canary.4 blocker.

| # | Check | Result | Evidence |
| --- | --- | --- | --- |
| 1 | `close-gate` green | **PASS** | `close-gate` → `pass`, first time without a stale-result detour. |
| 2 | Zero unticked boxes on issues the PR closes | **PASS** | #1227: **0** unticked. Notably #1227 carries **no** post-merge-only box, so `Closes` is correct here — unlike #1571/#1580, which needed `Refs`. |
| 3 | No new `deno-lint-ignore` / `as unknown as` / `@ts-ignore` | **PASS** | scan executed → **0** matches. |
| 4 | Named expensive gates `SUCCESS` | **PASS** | `scaffold-runtime (aspire + docker + postgres)` · `scaffold-runtime-sqlite` · `scaffold-static` · `build` · `code-quality` · `quality` · `check-test` · `surface-diff` · `deps-report` · `close-gate` — all `pass`; **pending 0, cancelled 0, failing 0**. |
| 5 | The single decisive claim, re-verified | **PASS** | Claim: *a canceled or timed-out quickstart restore is retried, bounded*. Proven by the slice's attempt observation **`[1, 2, 3]`** for `maxRetries: 2`, plus per-class RED→GREEN mapping. Focused suite `33 passed / 0 failed`; root-cwd package suite **794 passed / 0 failed**. |
| 6 | Changed-file audit | **N/A, audited** | 11 files, all under `packages/cli/e2e`. No publish/release logic, no other gate's retry behaviour, no timeout-value change. |
| 7 | PR body checklist matches what shipped | **PASS** | DoD complete; the worklog's change-to-test mapping states which change each test is RED without. |

**Overlap guard:** merge-base `7aa4aadfd`, main `fa5d0d411`, **1** commit since, **no file overlap**.
`agentic:review-threads` → `PASS threads=0 unanswered=0`.

## IMPL-EVAL

`verdict: PASS`, automatic dispatcher, run **`31610825898`**, at head `4f93d3134`. Label-triggered;
**no manual OpenHands, no Fable**.

## Baseline failures explicitly not repaired

`deno task --cwd packages/cli test` reports `791 passed / 3 failed`; the **root-cwd equivalent is
794 / 0**. The three are cwd-sensitive root-relative paths (two docs, one service-env script),
unrelated to this diff and reproduced once for corroboration. A p0 release-blocker fix does not absorb
unrelated task-path assumptions — that scope discipline is deliberate and recorded rather than silent.

## Lock discipline

**`deno.lock` unchanged; no dependency added.** Stated explicitly because incomplete lock closures in
this lane cost a canary and produced two P0 issues (#1571, #1580).

## Verdict

**Cleared to merge.**
