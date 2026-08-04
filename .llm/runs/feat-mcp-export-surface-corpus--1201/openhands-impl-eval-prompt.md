use harness

Evaluate PR #1218 as the milestone-run composed IMPL-EVAL for #1201. Review the pushed implementation against the locked plan and the PR's authoritative Definition of Done. Inspect the distinct generated export-surface corpus, all four bounded MCP question forms, receipt/truncation conventions, mirror-free acceptance, generation provenance, public exports, documentation, and JSR/publish hygiene. Treat the canary adoption measurement as orchestrator-owned and do not claim or close it.

The supervisor recorded one unrelated full CLI E2E failure: 51/52 gates passed, while the generated users-service Prisma database health probe returned 503 after scaffold, DB init/generate/seed, generated checks, and Aspire startup passed. Determine whether it is causally related to this changeset; do not edit unrelated CLI/database code merely to make the gate green.

Write the verdict of record to `.llm/runs/feat-mcp-export-surface-corpus--1201/evaluate.md` and the required workflow summary. Preserve lock hygiene: do not commit `deno.lock` or unrelated/scratch churn. If a slice-owned correction is required, make only that correction, validate it, and report it explicitly.

## SKILL

- `.agents/skills/netscript-harness` — follow the locked milestone evaluator protocol and tracked verdict contract.
- `.agents/skills/netscript-doctrine` — evaluate `packages/mcp` as Archetype-2 integration code.
- `.agents/skills/netscript-deno-toolchain` — inspect the `deno doc --json` corpus source and native documentation gates.
- `.agents/skills/jsr-audit` — verify new exports, documentation, and publish readiness.
- `.agents/skills/netscript-tools` — use scoped wrappers, reliable gate receipts, and lock hygiene.
- `.agents/skills/netscript-pr` — format the IMPL-EVAL result and preserve the issue evidence split.
