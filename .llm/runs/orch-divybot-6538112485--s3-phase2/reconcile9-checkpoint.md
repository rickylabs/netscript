# Latest-main stack reconciliation — design checkpoint

Source barrier: child Desktop11b3a was independently approved and committed at
c3dba2ce, against parentc5877ff8. Main advanced from6a1d84a6 to0af8fd9e through
2452docs/2558CSS/2456agent-design guidance while those gates ran. Both remote
branches are unchanged. Preserve the reviewed child and rebase the parent,
then the child, before any push or next product unit.

1. Public surface: preserve all reviewed parent/child APIs, parts, values, keys
 and callback semantics, plus main's accepted docs/design-guidance behavior.
 No token, dependency, lock, native bridge or updater change.
2. Vocabulary: native CSS nesting preserves the same nonzero Utility root
 specificity and ordered selectors/declarations/media rules. A byte difference
 is not itself a behavior difference. New budget compatibility must be proved.
3. Ports: raw Git/rebase, canonical Deno carrier generators and configured
 structured gates; browser CSSOM and current source/builder tests. Existing
 same read-only Opus5.5 high evaluator remains assigned.
4. Constants: keep the exact Utility root selector; never replace it with
 zero-specificity where(). Preserve220000raw/27000gzip upstream budget pending
 actual integrated measurements. No unreviewed budget raise or exemption.
5. Ordered slices: backup current parent/child refs; rebase parent onto main;
 inspect maintained conflicts separately from generated carriers. Main's46CSS
 changes are syntax-only nesting; preserve reviewed rule semantics and retain
 consolidation. Canonically regenerate carriers. Prove non-CSS preservation,
 main-only changes, all3locks and CSS ordered-rule equivalence. Run current
 configured gates, including the new payload budget. If feature-growth policy
 needs reconciliation, write a concrete reviewed design before changing it.
 Independently review and commit parent integration. Rebase child onto that
 parent, preserve its reviewed source and repeat applicable fresh gates/SAME
 review/carriers/publication. Audit public additions/counts0 and exact leases
 before pushing either branch. No next component unit before closure.
6. Deferred:11b3b/12a/12b/13 remain mandatory. Old-base executions are historical
 after the selected tree changes; draft-skipped CI is not green. No READY,
 final report, labels, closing keyword, merge, early promotions or foreign
 resource mutation.
7. Contributor path:packages/fresh-ui/README.md for source/contract work;
 configured publish-size test for budgets and canonical carrier tasks for
 generated output. Upstream CSS parity evidence is read-only reference, not
 a replacement for integrated proof.
