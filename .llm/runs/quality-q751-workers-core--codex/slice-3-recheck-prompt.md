# Slice 3 correction recheck — #751

Recheck your blocking doc-lint F1 against the current working tree. The canonical runtime aliases are
retained, their dependency types are explicitly exposed through `src/runtime/mod.ts` and
`src/registry/mod.ts`, and schema-derived domain types that leaked private schema symbols were
rewritten as explicit, equivalent structural contracts. Runtime and registry entrypoints now each
have 0 private-type-ref diagnostics. The identical full package doc-lint is now combined 13, improving
on your measured pre-Slice-3 baseline of 24 (and has 0 missing JSDoc / 0 other errors).

The 110-file scoped check and 25 package tests pass after the correction; scanner remains 0 findings /
0 allowances. Inspect the correction, re-run the smallest necessary doc/check/scanner probes, and
ensure the added runtime re-exports do not create duplicate export names or change runtime behavior.
Do not edit source or commit. Update `slice-3-review.md` with correction evidence and final `PASS` or
`FAIL_FIX`.
