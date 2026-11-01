# Exact-head evidence and delivery

Retain PR2482 and branch fix/workers-listener-restart-budget. Merge main, never
rebase/force-push. Owner requires reference-only issue body, no closing keyword;
coordinator controls issue closure, labels, E2E gate arming and merge. Final report
must go through .divybot-final-report.tmp renamed atomically to
.divybot-final-report.md; assignment publisher posts it. Do not post canonical
READY with gh as well. PR phase/evaluator comments still go to existing PR.

Gate receipts before merge commit identify previous immutable HEAD and the dirty
merge tree; don't describe them as final clean-head receipts. Preserve sanitized
summaries in the run and put exact pushed-head evaluator/CI evidence on the PR,
avoiding a subsequent evidence-only commit invalidating the reviewed head.
