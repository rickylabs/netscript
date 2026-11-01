# Resume — W2 and manual CI harness correction

Owner directed continued CI remediation; verbatim instruction and bounded corrective cycle are
recorded in worklog. Original five-round cycle remains historical. Corrective review1 CHANGES
at da79e72 found native Deno KV retry regression; fixed by lease-capability guarding Redis's
nack-and-return policy. Real Deno KV job-DLQ-outage and shutdown-task replacement tests fail
before and pass after. Six Redis/Garnet listener survival cases remain green.

Manual e2e-cli41162244034 exposed an inherited desktop test-driver launcher filename assumption,
matching latest main manual run40539973506. Fix discovers the unique executable sibling of the
runtime without guessing a version stem; absent/ambiguous cases remain errors. No packaging
product behavior, skip policy, labels/milestones or workflow is changed.

corrective-validation.json records285pass/0fail/2CI-onlyskip full suite and passing structured
static/quality/corpus gates. Commit/push this corrected slice. Then run manual e2e-cli and the
same independent evaluator corrective review2 at the exact frozen head. Update acceptance only
with actual MERGE/full-runtime proof, then rerun close-gate without moving the head. No local
scaffold.runtime, merge/tag/release. Canonical report uses excluded atomic handoff.
