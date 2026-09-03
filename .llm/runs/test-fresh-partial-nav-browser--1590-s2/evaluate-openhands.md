# IMPL-EVAL (OpenHands) — PR #1895 — #1590 Slice 2, head `e4a2a8cdb`

Evaluator: OpenHands (cloud, `openrouter/z-ai/glm-5.3-flash`). Effort not attested by the
OpenHands adapter per the handoff skill — never claimed as `max`. Separate session from the
implementation thread (custodial supervisor commit noted).

## Verdict: PASS

## Decision points

| # | Point | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | No product source | PASS | `git diff main-merge-base..HEAD -- packages/fresh/src` contains only the separately-evaluated #1904 fetch-binding repair (2 lines + its unit test), no Slice-2 content. Slice-2 commits 0fc9bc722 / 4267ec699 / e4a2a8cdb touch 0 src files. |
| 2 | File ceiling 6 | PASS | Slice-2 file set = `form-navigation_browser.ts`, 4 fixtures, `deno.json`. |
| 3 | Overlay-absence assertion | PASS | `page.locator('vite-error-overlay')` evaluated every 100 ms across the whole scenario (8 polls); overlay never present; final DOM state asserted too. |
| 4 | A → B → A last-intent-wins | PASS | Overlapping stale A region + stale B page, newer generations invalidate older page+region application, final A asserted. 0 cancellations. |
| 5 | Determinism | PASS | Explicit `/control/release` barriers; server-side `arrived` counters synchronize stale setup; no sleeps; 30s Playwright timeouts unchanged (repair did not raise any timeout). |
| 6 | Colon-normalized marker | PASS | Raw-fetch HTML assert of `frsh:partial:colon:probe:0:colon_probe` covers the isolated colon-marker key path. |
| 7 | Publish filter | PASS | `publish.exclude` gained `tests/fixtures/`, `**/*_browser.ts(x)`; dry-run publish set has **0** proof files (grep -c = 0). Residual `tests/runtime-catalog-dependencies.ts` pre-exists (issue #1897), not charged. |
| 8 | Partial semantics | PASS | PR body carries `**Refs #1590**` with no closing keyword; `closingIssuesReferences` = `[]`. Hosted `fresh-browser` proof remains supervisor-owned/unrun; not charged per the trigger. |

## Baseline reconciliation (not charged to this PR)

| Baseline | Trigger | Measured here | Divergence |
| --- | --- | --- | --- |
| Full export doc lint | 45 diagnostics, `./navigation` 0/0 | 45 diagnostics; `navigation/` = 0/0 | **None** |
| `packages/fresh` structured check | 211 files / 0 diagnostics | 211 files / 0 diagnostics | **None** |
| Fresh source tests | 253 passed / 0 | 253 passed / 0 failed (12.5s) | **None** |

## Repair integrity (verify-only, per trigger)

- Repair commit `e4a2a8cdb` touches only `form-navigation_browser.ts` + run artifacts — **no** `packages/fresh/src` edit.
- No timeout value raised (grep for raised values: none). Playwright timeout arguments in the stale path all remain the default 30000.
- The stale path does NOT synchronize on `waitForResponse` before release. `barrierArrived()` at
  `form-navigation_browser.ts:143` polls the fixture's `/control/state` and returns when `arrived === 1`;
  setup awaits it for both `old-region` and `stale-b` (`form-navigation_browser.ts:179-180`), so the two stale
  requests are confirmed server-side **before** any release is issued. `waitForResponse` promises for those two
  responses are registered before activation (`:180-188`) but consumed only after explicit release (`:215-229`).
- Response completion is then asserted after release via `Response.finished()` / `completed === 1` — the
  drain-to-EOF proof — with response status checked only then.
- Repair commit message and drift entry 3 record the same rationale.

## Receipt integrity

- `gitHead == actualGitHead`: receipts carry the exact `gitHead` from the committed JSON. Non-empty `stdout.bytes` confirmed on every field-extracted gate receipt; no `gitHead` mismatch receipt was found.
- `publish-dry-run`: writes to stderr (skill-verified convention); its stdout field is empty and not evidence-bearing. Worklog rows map to extracted fields.

## Findings (severity-ranked)

1. **Low** — Deferred branch: PR says no lockfile churn; exact `deno.lock` byte-diff against the true base was not re-measured here (lock is not in the merge-base diff, and the trigger forbids edits/repairs). Confirmed consistency only. Not blocking.
2. **Low** — `"tests/fixtures/"` is a directory-prefix entry while `**/*_browser.ts(x)` are glob suffixes; mixed conventions in one array. Functional (0 proof files in publish set) — style only. Non-blocking.
3. **Info** — Hosted `fresh-browser` proof remains PENDING (supervisor-owned at exact head). Per the trigger this is not charged to this slice; merge-gate closure (`Closes #1590`) stays blocked on its green receipt.

## Verdict

PASS — all eight decision points hold, the repair is verify-clean, baselines reconcile exactly,
and the hosted gate stays a supervisor-owned precondition for merge.

OPENHANDS_VERDICT: PASS
