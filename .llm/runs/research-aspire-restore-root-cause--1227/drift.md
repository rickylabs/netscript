# Drift Log: root-cause Aspire restore cancellation (#1227)

## 2026-08-05 — owner route and Plan-Gate overrides

- **What:** Run uses OpenAI GPT-5.6 Sol xhigh and no local PLAN-EVAL.
- **Source:** Owner brief (`Route` and `Per D6 no local PLAN-EVAL`).
- **Expected:** Canonical lane-policy effort and separate formal PLAN-EVAL.
- **Actual:** Owner-selected investigation route and written Plan-Gate waiver.
- **Severity:** significant
- **Action:** accept
- **Evidence:** `supervisor.md`; `plan.md` D5.

## 2026-08-05 — corrected upstream repository

- **What:** Upstream issue/source research target is `microsoft/aspire`, not `dotnet/aspire`.
- **Source:** Owner correction during bootstrap.
- **Expected:** Initial brief named `dotnet/aspire`.
- **Actual:** Canonical upstream is `microsoft/aspire`; no upstream search had yet run.
- **Severity:** significant
- **Action:** fix
- **Evidence:** `research.md` finding 3 and upstream evidence to be retained under `evidence/`.

## 2026-08-05 — stdin experiment was negative and narrowed out of acceptance

- **What:** The initial plan proposed comparing `aspire restore < /dev/null` as a TTY hypothesis.
- **Source:** Initial plan risk/open-question sweep.
- **Expected:** Use stdin behavior to classify an unknown cancellation source.
- **Actual:** Stable restore with stdin from `/dev/null` completed in 15 seconds; a PTY control
  completed in 9 seconds. Neither reproduced the intermittent hang. The retained cloud log,
  NetScript abort source, exact upstream stopped-helper issue, six local stopped helpers, and PR
  #1305 cached-control failures name the cancellation and lock mechanism; stdin behavior is not the
  selected mitigation.
- **Severity:** minor
- **Action:** accept/narrow
- **Evidence:** `evidence/failing-cli-log.md`; `evidence/local-and-control-evidence.md`.

## 2026-08-05 — mitigation superseded by exact fixed daily

- **What:** PR #1305 S2 prewarm/signature retry is not carried forward; exact daily CLI is pinned.
- **Source:** Run 30964226683 and upstream #18948/#18958.
- **Expected:** Package availability plus retry might bound feed latency.
- **Actual:** A verified cache still hung in bundled NuGet restore for 300 seconds; upstream
  identifies orphaned helper lock contention, and the fixed daily restores the same graph cleanly.
- **Severity:** significant
- **Action:** supersede
- **Evidence:** `research.md`; all three files under `evidence/`.
