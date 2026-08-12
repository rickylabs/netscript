# Research — #1565 snippet walker

- Baseline `4637e9f41` reproduces the clean census exactly: `docs snippets: PASS scanned=578 ts=211 tsx=77 typescript=7 ts_like=295 tier1=35 checked=21 exempt=14 outside_floor=260 malformed=0`.
- `collectSourceFiles()` recursively visits every directory below `docs/site`; it has no ignored/generated-directory policy.
- `docs/site/.gitignore` names `_site/`, Lume's generated output.
- The baseline `pages-workflow_test.ts` already asserts that `docs:snippets` precedes `deno task build`; no production change is required for acceptance item 3.
- No package/plugin surface or architecture doctrine is involved. Scope overlay: docs. PLAN-EVAL: N/A because the issue supplies the complete deterministic contract, boundaries, and gates.

