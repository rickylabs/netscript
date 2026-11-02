# S5 CI repair

The failing run was 41309455869 at head 1acff81. Shard 3 exposed a real public
init/resource-regeneration conflict: init supplied pagination but the public resolver
did not. Shards 4–6 exposed formatter and legacy template assertions omitted from
the previous local test inventory. No CI workflow or test exclusion was changed.

Generated loader markers now preserve optional canonical queryInput values. Public
regeneration adopts them only when the selected client and procedure reproduce the
complete existing file. Explicit inputs win. Authored, unowned, edited-marker, and
mismatched selection cases still conflict. Tests cover dry-run and apply no-ops plus
six refusal cases. The existing public-command-tree test is unchanged.

Layout/navigation templates are formatted canonically. Their emitted source remains
identical after canonical formatting across five project names. Existing app tests
now expect the approved Utility routes, real capability data and no fabricated rows.
Embedded assets regenerated. Resource-slice contributor documentation explains the
optional schema-1 extension and old CLI fail-safe behavior.

Independent PLAN-EVAL and IMPL-EVAL pass (s5-plan-review.md, s5-impl-eval.md).
Structured ten-file source check/lint/fmt pass; the final label assertion additionally
passes all three wrappers. Quality, release preflight and docs accuracy pass. All
14 non-assets root check tasks pass; assets-barrel freshness runs after sign-off
because it compares against committed source. Expanded test result is authoritative
in s5-scaffold-tests.json; its inventory is s5-test-inventory.json.

Close-gate metadata was corrected to describe completed local proof without making
remote CI green a self-referential checklist condition. Required remote CI remains
a separate readiness requirement. Runtime stays UNPROVEN under the independently
verified non-opt-in workflow policy. No READY until the corrected head is green.

Final expanded suite: **387 passed, 0 failed, 0 ignored** across 51 files. This
satisfies the remaining condition in the independent code review.
