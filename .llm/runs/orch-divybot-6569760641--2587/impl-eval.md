**PASS — follow-up read-only IMPL-EVAL of the supplied revision packet for issue #2587 / PR #2589.**

Both previous findings are resolved. I found no new blocking correctness, security, lifecycle, or regression issue in these changes.

- **P1 closed — producer restart/replacement identity.** In `packages/cli/src/kernel/assets/service/adapters/record-activity.ts.template`, the UUID suffix is allocated only when constructing a producer. Normal writes and transport retries retain that producer; replacement after closure receives a new identity. This prevents unrelated events from reusing an earlier producer’s epoch/sequence tuple. The added adapter test covers reuse and terminal replacement, while the supplied live receipt covers the critical service-only restart with stream history retained and both committed updates present.

- **P2 closed — missing producer-link fallback.** In `packages/cli/src/kernel/assets/app/lib/scaffold-capabilities.ts.template`, the selected service must reference the discovered stream resource before any stream probe occurs. Missing or mismatched references return `installed-unwired`, activating the existing record-change fallback with explicit owner attribution. The negative controls cover link removal after a successful read, and the supplied live receipt exercises that case with historical events retained. Linked empty, denied, and unavailable states retain their existing handling.

- **Chart and alignment changes are sound at source level.** The horizontal `ChartBlock` renders each supplied status label and numeric count through its shipped implementation. The revised CSS confines the neutral weekly-bar override to column charts, preserves the status chart’s semantic colours, and aligns the rich table’s amount heading and cells. These changes continue to use service-derived data. Visual approval remains with the independent reviewer.

The earlier source assessment of committed create/update activity, verified-or-anonymous actors, seed-job idempotency, real progress/completion time, nonfuture sample timestamps, and final weekly-group day count remains valid.

**Evidence limits:** The new receipt reports **23 passed, 0 failed**. The restart, fallback, browser, and DOM results are supplied evidence; I did not execute those checks. I independently inspected the revised packet and the supporting producer and chart implementations. GitHub still exposed `4951bf1` when checked, so this PASS applies to the **supplied revised source**, not to an assertion that the published commit already contains it.

Full runtime CI, final required validation, and the independent visual re-review remain prerequisites before READY. No files were changed and nothing was posted.