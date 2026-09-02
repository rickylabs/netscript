# Context pack

Issue `#1467` adds locale as the first canonical non-auth SDK client contribution. Baseline is clean
`origin/main` at `77ad823dc`. Placement is `packages/sdk/src/client`, exported through the existing
`./client` entrypoint/root barrel; no export-map or dependency change. `accept-language` is allowed,
locale context is optional, cache mode is partitioned, and all private adapter/trace surfaces are
out of scope. The auth reference exists only on `origin/feat/sdk-credential-contribution`, so this
slice uses it as a pattern without integrating it. `PLAN-EVAL: N/A` is owner-directed and justified
in `plan.md`/`worklog.md`. IMPL-EVAL remains a separate supervisor-owned pass after this lane.

Implementation and required pre-commit gates are complete. SDK final test count is 230/0/0;
doc-lint adds zero diagnostics; quality and architecture gates pass; lock hash is unchanged. The
implementation commit is `28e6ca75d...`; exact clean-tree publish dry-runs and all post-commit
carrier checks pass. Remaining lane steps are the evidence commit, final carrier recheck,
explicit-refspec push, and atomic PR open/metadata application.
