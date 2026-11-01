# Latest owner budget/readiness decision — final full-scope caps

> COORDINATOR: Owner decision (Eric, relayed 11-01): keep the global component-CSS budget and raise it for the gap components. 1. First apply the #2558 consolidation pattern (native nesting under the single Utility scope) to every new component to minimise size. 2. Then measure the final full-scope raw and gzip sizes and set the caps to measured + about 2% headroom, with a one-line reason at each constant: gap components from #2488 (owner decision 2026-11-01). 3. Do not weaken the check logic; keep the red-then-green proof that the budget still rejects bloat. Then finish the remaining scope, merge origin/main normally (no rebase, no force-push), and post READY with CI green or policy-skipped. Do not wait for an answer.

This explicitly supersedes the earlier preserved4019/473headroom formula for
final readiness. After remaining Desktop and harness work, consolidate every
applicable repeated Utility scope, measure ALL final non-theme component CSS,
and set each cap to ceil(final measured bytes ×1.02). Each raw/gzip constant
gets the one-line reason: gap components from #2488 (owner decision 2026-11-01).
Keep the global inventory, source/carrier equality, compression, both assertions
and5MBcap unchanged. Re-run red controls, exact restore and final positive gate.
The current merge's339588/45224limits are intermediate evidence under the
previous owner grant, not a claim about final2%headroom. Do not mutate them
while current frozen browser gates run. No future-scope credit or arbitrary
buffer, no skip or assertion weakening, no new theme predicate where there is
no repeated scope to factor.

Final READY may use green or explicitly policy-skipped CI at the exact final
head, as the latest owner instruction states. Failed/pending checks are not
acceptable, and full remaining scope still must be delivered. No rebase or
force-push; use normal merges and plain pushes. No final report/READY now.
