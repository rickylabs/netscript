# R2 worklog — planning/evidence only

## Design checkpoint before R2 evidence code

1. **Public surface:** unchanged public SDK clients, query factories and TanStack
   utilities. New run-local controls observe the real query paths; no product
   implementation or old assertion changes are authorized in this round.
2. **Vocabulary:** transport dedupe (one native wire request for eligible calls),
   TanStack per-key sharing (one query execution within one QueryClient), supplied
   signal (TanStack always passes it), encoded signal (optional standard-request
   signal before conversion to a Web Request), and LEAK (content-publication scan).
3. **Ports:** existing public SDK/contribution/query APIs, upstream QueryObserver
   and QueryClient, the final Fetch observation seam, and git's read-only index
   and commit views for the content scan. No new product port or dependency.
4. **Constants:** named synthetic response and bounded observation interval;
   scanner category identifiers and narrow non-operational documentation domains.
   No credentials, operator addresses, session identifiers or usage measurements.
5. **Slices:** one R2 checkpoint: retain R1 FAIL; read actual API/upstream source;
   add public query-path controls; write corrected plan/dispositions and mutation
   protocol; run scoped wrappers and LEAK-S0-R2; seal, commit, push and comment
   once on #2611. S1–S3 remain proposed product slices behind the existing gate.
6. **Deferred:** product mutations/old-test edits, runtime/production validation,
   cancellation enhancement for queries.*, release and consumer qualification.
7. **Contributor path:** plan-R2.md is the complete next-review entry point;
   dispositions-R2.md maps every R1 blocker/advisory to exact R2 evidence.

## Review identity and round accounting

R1 full verdict SHA-256 verified against the coordinator's provided hash and
copied without edits into plan-R1-verdict.md. It remains **FAIL**, with B1–B3.
This is R2, not a reset. No evaluator/design agent was launched by this builder;
no self-evaluation or plan PASS is claimed. Parent owns independent exact-R2
review and product continuation. The prior product fence remains in force.

## Evidence status

- New real public API/QueryObserver controls: 2 PASS / 2 semantic assertion FAIL,
  zero ignored, exit 1. The allowlisted test gate retains a fresh child report.
  Independent wire-cancellation assertions after the red count remain unproven.
- Structured check/lint/fmt cover both new TypeScript files, exit 0, complete
  two-file selection. Both sanitizers explicitly true on all new tests.
- Actual public oRPC 1.15.5/1.16.1 inspection: four relevant implementation/type
  excerpts are byte-identical; file/excerpt/manifest hashes and empty diffs retained.
  No package/lock edit or full-version parity/upgrade-fix claim.
- Native Request constructor only-if-cached mode control retained; no network.
- All 13 original R1 evidence hashes, the R1 manifest and eight protected
  source/manifest/lock hashes verify. R1 FAIL retained exactly. No old tests edited.
- LEAK-S0-R2 staged content scan found zero findings; all added run/source hunks
  were also reviewed for publication safety. Its final receipt is regenerated
  after the last evidence update. The exact committed checkpoint is scanned
  again before publishing the one PR comment. A scan is automated content-gate
  evidence, not an independent plan PASS. maint:leak-check is not used as
  publication-content evidence.
- Final immutable-manifest-R2.json is generated last and binds the new R2 plan,
  protocol, dispositions and evidence, plus the original R1 preservation hashes.

## Reconcile and stop

Only adjacent R2 artifacts may enter this checkpoint; product/source mutation
experiments are unexecuted. Preserve the original round count and every sealed
R1 byte. Commit and normal-push only to the existing branch/PR, then post the one
authorized safe R2 checkpoint comment on #2611. No new #2610 or inbox comment.
Parent exact-R2 PASS and explicit product continuation remain required.
