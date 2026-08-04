# Context Pack

- Issue: #1227
- Branch: `fix/aspire-restore-reliability-1227`
- Baseline: `origin/main` at `6c3b534fc`
- Route: openai / gpt-5.6-sol / medium
- Surface: `packages/cli/e2e`, runtime E2E workflows
- D6: composed evaluation; no local PLAN-EVAL
- Lock hygiene: inherited `deno.lock` change is excluded.
- S1 implemented: per-gate timeout, 3 × 180-second restore budget, infrastructure classification,
  and pretty-report rendering.
- S2 implemented: exact 13.4.6 NuGet package cache across two PR runtime jobs and both canary workflows.
- S3 green: 108 E2E unit/cache-policy tests, scoped check/lint/fmt, YAML parse, quality and arch gates.
