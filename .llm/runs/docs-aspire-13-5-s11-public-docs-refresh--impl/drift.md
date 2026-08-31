# Drift Log — docs-aspire-13-5-s11-public-docs-refresh--impl

## D-01 — 2026-08-30 — PLAN-EVAL: N/A justified by supervisor ratification
- **Status:** Approved.
- **Details:** The overarching Aspire 13.5 adoption plan completed two cycles of PLAN-EVAL. Sub-issue 11 (`sub-issues/11-public-docs-refresh.md`) defines the bounded documentation scope and was ratified for implementation.

## D-02 — 2026-08-30 — doc:lint applicability on prose slices (D-30)
- **Status:** Handled.
- **Details:** Per D-30 in supervisor drift, `deno task doc:lint` requires `--root` and lints TypeScript JSDoc comments, not Markdown prose. For prose-only documentation pages, `doc:lint` is recorded as N/A with rationale.

## D-03 — 2026-08-31 — D-137 generated-asset conflict policy

- **Status:** Approved and applied.
- **Details:** Replaying the 11 S11 commits from old S10 `a46ea16d0` onto corrected S10
  `c9e3fcbe8` stopped at five commits, exclusively for generated agent-doc/publish assets. Each
  generated conflict took the corrected-S10 upstream side in full under owner rule 1; no generated
  blob was hand-merged. No gate-registration, listener-contract, or other non-generated source
  conflict occurred. The one authorized assets-barrel generation and its diff-clean check passed.
  The broader optional `check:agent-docs-prose` check consequently reports the upstream-retained
  `prose.json.gz` and `provenance.json` as stale; regenerating them would contradict the ruled
  conflict disposition and was not performed.
