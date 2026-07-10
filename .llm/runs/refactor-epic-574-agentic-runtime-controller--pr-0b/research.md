# Research: PR 0B desired-state agentic runtime controller

## Baseline

- Issue #576 depends on the canonical WSL runtime contract from #575 / PR #584.
- This stacked branch starts at foundation sign-off commit `9b75470`.
- Existing `.llm/tools/agentic/` scripts and `wsl-foundation*.ts` are the compatibility surface to
  consolidate, not duplicate.

## Research Questions

1. Which current agentic commands, schemas, and wrappers become typed runtime-controller adapters?
2. What stable command/result contract covers `doctor`, `bootstrap`, `configure`, `launch`,
   `resume`, `smoke`, `fallback`, `restore`, `status`, `repair codex-remote`, and `rollback`?
3. How will dry-run and inspection remain read-only and secret-safe?
4. Which compatibility wrappers remain, and what retirement boundary belongs to later epic issues?

Detailed source inventory and prior-art findings are pending the single WSL worker.
