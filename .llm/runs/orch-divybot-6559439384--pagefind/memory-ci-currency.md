# Current-head checks and readiness

`deno task agentic:pr-checks -- --repo rickylabs/netscript --pr 2575 --pretty` correctly separates current from superseded checks, but its terminal PASS means no current failures; it can still list pending jobs. Inspect every current row before READY, not only the tool exit code.

Touching `.github/scripts/ci-classify-changes.test.ts` selects the full classifier vector by policy; do not infer runtime skips merely from docs scope. On a draft PR, core/scaffold/Fresh jobs are legitimately skipped by the separate draft workflow policy, while Pages build/browser still run. Report that distinction; draft-policy skips do not prove CLI runtime. No skip labels were added.
