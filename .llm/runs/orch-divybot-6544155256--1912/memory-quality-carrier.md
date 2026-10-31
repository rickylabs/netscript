# 2026-10-31 — Aspire manifest after adding CI scripts

Any newly tracked file mentioning Aspire, including .github/scripts CI smoke helpers, needs the canonical tracked-surface carrier refresh. Run `deno run --allow-read --allow-run=git --allow-write=.llm/tools/validation/fixtures .llm/tools/validation/aspire-surface-manifest.ts`; never hand-edit the TSV or exempt the helper. Verify with the aspire-version-parity gate (run-gate.ts) and focused check-aspire-version-parity_test.ts through the structured test wrapper.

If gh run view --log-failed refuses a still-running workflow, a completed job's log is available via `gh api repos/rickylabs/netscript/actions/jobs/<job>/logs --allow-escape-sequences`. Save raw logs outside Git; terminal escape sequences otherwise cause gh to reject output. Read actual failing step, rather than assuming a missing-test report is present.
