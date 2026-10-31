# Documentation gate scope

run-deno-doc-lint.ts accepts a single --root; repeating it selects only the last one. Run separately for core and plugin. At the #2383 baseline: full export core has 7 private-type-ref findings and plugin has 30, zero missing JSDoc/other errors; predecessor #2499 records the same counts. A tests/README-only change does not repair or deepen exported source debt. Do not report these existing doc-lint failures as green.
